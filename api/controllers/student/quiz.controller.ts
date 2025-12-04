import httpStatus from 'http-status';
import type { Request, Response, NextFunction } from 'express';
import moment from 'moment-timezone';
import { User } from '@/schema/user';
import { Quiz } from '@/schema/quiz';

const TIMEZONE = 'Asia/Dhaka';

/**
 * Get quiz for taking (without correct answers)
 */
export const getQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { courseId, quizId } = req.params;

    // Verify enrollment
    const isEnrolled = user.enrolledCourses.some((ec: any) => ec.course.toString() === courseId);
    if (!isEnrolled) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Not enrolled in this course',
      });
    }

    // Get quiz
    const quiz = await (Quiz as any).get(quizId);

    // Verify quiz belongs to course
    if (quiz.course.toString() !== courseId) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Quiz does not belong to this course',
      });
    }

    // Check if quiz is published
    if (!quiz.isPublished) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: httpStatus.NOT_FOUND,
        message: 'Quiz not found',
      });
    }

    // Check availability (convert to Bangladesh timezone)
    const now = moment().tz(TIMEZONE);
    if (quiz.availableFrom && moment(quiz.availableFrom).tz(TIMEZONE).isAfter(now)) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Quiz is not available yet',
      });
    }

    if (quiz.availableUntil && moment(quiz.availableUntil).tz(TIMEZONE).isBefore(now)) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Quiz is no longer available',
      });
    }

    // Get user's previous attempts
    const userDoc: any = await User.findById(user._id).exec();
    const quizAttempts = userDoc.quizzes.filter((q: any) => q.course.toString() === courseId);

    // Check max attempts
    if (quizAttempts.length >= quiz.maxAttempts) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Maximum attempts reached for this quiz',
      });
    }

    // Transform quiz and remove correct answers for security
    const quizData = quiz.transform();
    const sanitizedQuestions = quizData.questions.map((q: any) => {
      const sanitized = { ...q };
      // Remove correctAnswer from question object if showing answers is disabled
      if (!quiz.showCorrectAnswers) {
        delete sanitized.correctAnswer;
      }
      // Shuffle options if enabled
      if (quiz.shuffleOptions && sanitized.options) {
        sanitized.options = sanitized.options.sort(() => Math.random() - 0.5);
      }
      return sanitized;
    });

    // Shuffle questions if enabled
    let finalQuestions = sanitizedQuestions;
    if (quiz.shuffleQuestions) {
      finalQuestions = [...sanitizedQuestions].sort(() => Math.random() - 0.5);
    }

    res.json({
      status: httpStatus.OK,
      message: 'Quiz retrieved successfully',
      data: {
        ...quizData,
        questions: finalQuestions,
        metadata: {
          attemptNumber: quizAttempts.length + 1,
          maxAttempts: quiz.maxAttempts,
          timeLimit: quiz.timeLimit,
          dueDate: quiz.dueDate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit quiz answers and calculate score
 */
export const submitQuiz = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { courseId, quizId } = req.params;
    const { answers, timeTaken } = req.body;

    // Verify enrollment
    const isEnrolled = user.enrolledCourses.some((ec: any) => ec.course.toString() === courseId);
    if (!isEnrolled) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Not enrolled in this course',
      });
    }

    // Get quiz
    const quiz = await (Quiz as any).get(quizId);

    // Verify quiz belongs to course
    if (quiz.course.toString() !== courseId) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Quiz does not belong to this course',
      });
    }

    // Get user
    const userDoc: any = await User.findById(user._id).exec();

    // Check max attempts
    const quizAttempts = userDoc.quizzes.filter(
      (q: any) => q.quiz?.toString?.() === quizId || q.course?.toString?.() === courseId
    );
    if (quizAttempts.length >= quiz.maxAttempts) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Maximum attempts reached for this quiz',
      });
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;

    const scoredAnswers = quiz.questions.map((question: any) => {
      totalPoints += question.points || 0;

      const userAnswer = answers[question._id?.toString?.() || question.questionId?.toString?.()];
      let isCorrect = false;

      // Check answer based on question type
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        // For multiple choice and true/false, check exact match
        isCorrect = userAnswer?.toString?.() === question.correctAnswer?.toString?.();
        if (isCorrect) {
          earnedPoints += question.points || 0;
        }
      } else if (question.type === 'short-answer') {
        // For short answers, do case-insensitive comparison
        const normalizedUserAnswer = userAnswer?.toString?.().toLowerCase?.().trim?.() || '';
        const normalizedCorrectAnswer = question.correctAnswer?.toString?.().toLowerCase?.().trim?.() || '';
        isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        if (isCorrect) {
          earnedPoints += question.points || 0;
        }
      }
      // For essay and matching, manual grading required - award no points automatically

      return {
        questionId: question._id || question.questionId,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: question.points || 0,
        earnedPoints: isCorrect ? question.points || 0 : 0,
      };
    });

    // Calculate percentage score
    const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = scorePercentage >= quiz.passingScore;

    // Store quiz submission in user
    userDoc.quizzes.push({
      quiz: quizId,
      course: courseId,
      module: quiz.module,
      answers: scoredAnswers,
      score: Math.round(scorePercentage * 100) / 100,
      timeTaken,
      passed,
      submittedAt: new Date(),
    });

    await userDoc.save();

    res.json({
      status: httpStatus.OK,
      message: 'Quiz submitted successfully',
      data: {
        quizId,
        score: Math.round(scorePercentage * 100) / 100,
        percentage: scorePercentage,
        passed,
        earnedPoints,
        totalPoints,
        details: {
          totalQuestions: quiz.questions.length,
          correctAnswers: scoredAnswers.filter((a: any) => a.isCorrect).length,
          timeTaken,
        },
        results: quiz.showCorrectAnswers
          ? scoredAnswers
          : scoredAnswers.map((a: any) => ({
              questionId: a.questionId,
              userAnswer: a.userAnswer,
              isCorrect: a.isCorrect,
            })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quiz results for previous submission
 */
export const getQuizResults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { courseId, quizId } = req.params;

    // Verify enrollment
    const isEnrolled = user.enrolledCourses.some((ec: any) => ec.course.toString() === courseId);
    if (!isEnrolled) {
      return res.status(httpStatus.FORBIDDEN).json({
        status: httpStatus.FORBIDDEN,
        message: 'Not enrolled in this course',
      });
    }

    // Get user
    const userDoc: any = await User.findById(user._id).exec();

    // Find quiz submissions
    const submissions = userDoc.quizzes.filter((q: any) => q.quiz?.toString?.() === quizId);

    if (submissions.length === 0) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: httpStatus.NOT_FOUND,
        message: 'No submissions found for this quiz',
      });
    }

    res.json({
      status: httpStatus.OK,
      message: 'Quiz results retrieved successfully',
      data: {
        quizId,
        submissions: submissions.map((sub: any, index: number) => ({
          attemptNumber: index + 1,
          score: sub.score,
          passed: sub.passed,
          submittedAt: sub.submittedAt,
          timeTaken: sub.timeTaken,
          details: {
            earnedPoints: sub.answers?.reduce?.((sum: number, a: any) => sum + a.earnedPoints, 0) || 0,
            totalPoints: sub.answers?.reduce?.((sum: number, a: any) => sum + a.points, 0) || 0,
          },
        })),
        bestScore: Math.max(...submissions.map((s: any) => s.score || 0)),
        latestAttempt: submissions[submissions.length - 1],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all quiz submissions for user
 */
export const getMyQuizzes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { courseId, page = 1, perPage = 30 } = req.query;

    // Get user
    const userDoc: any = await User.findById(user._id)
      .populate('quizzes.quiz', 'title course')
      .exec();

    // Filter by course if provided
    let quizzes = userDoc.quizzes;
    if (courseId) {
      quizzes = quizzes.filter((q: any) => q.course?.toString?.() === courseId);
    }

    // Paginate
    const start = (Number(page) - 1) * Number(perPage);
    const paginatedQuizzes = quizzes.slice(start, start + Number(perPage));

    res.json({
      status: httpStatus.OK,
      message: 'Quiz submissions retrieved successfully',
      data: paginatedQuizzes.map((q: any) => ({
        quiz: q.quiz,
        course: q.course,
        score: q.score,
        passed: q.passed,
        submittedAt: q.submittedAt,
        attemptNumber: quizzes.filter((qa: any) => qa.quiz?.toString?.() === q.quiz?.toString?.()).findIndex((qa: any) => qa.submittedAt === q.submittedAt) + 1,
      })),
      pagination: {
        page: Number(page),
        perPage: Number(perPage),
        total: quizzes.length,
        totalPages: Math.ceil(quizzes.length / Number(perPage)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { getQuiz, submitQuiz, getQuizResults, getMyQuizzes };
