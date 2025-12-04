import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { APIError } from '@/api/errors/api-error';

const questionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'short-answer', 'essay', 'matching'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    options: [
      {
        id: mongoose.Schema.Types.ObjectId,
        text: String,
        isCorrect: Boolean,
      },
    ],
    correctAnswer: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    explanation: {
      type: String,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    instructions: {
      type: String,
    },

    // Association
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },

    // Quiz Content
    questions: [questionSchema],

    // Quiz Settings
    type: {
      type: String,
      enum: ['practice', 'graded', 'assessment'],
      default: 'practice',
    },
    passingScore: {
      type: Number,
      default: 60,
      min: 0,
      max: 100,
    },
    totalPoints: {
      type: Number,
      required: true,
      min: 0,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true,
    },
    allowReview: {
      type: Boolean,
      default: true,
    },

    // Timing & Availability
    dueDate: {
      type: Date,
    },
    timeLimit: {
      type: Number,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 1,
      min: 1,
    },
    availableFrom: {
      type: Date,
    },
    availableUntil: {
      type: Date,
    },

    // Grading
    autoGrade: {
      type: Boolean,
      default: true,
    },
    gradingCriteria: {
      type: String,
    },

    // Status
    isPublished: {
      type: Boolean,
      default: false,
    },

    // Statistics (denormalized)
    submissionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Created by
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
quizSchema.index({ course: 1, module: 1 });
quizSchema.index({ isPublished: 1, createdAt: -1 });
quizSchema.index({ dueDate: 1 });

// Instance Methods
quizSchema.method({
  transform() {
    const transformed: any = {};
    const fields = [
      'id',
      'title',
      'description',
      'instructions',
      'course',
      'module',
      'lesson',
      'questions',
      'type',
      'passingScore',
      'totalPoints',
      'shuffleQuestions',
      'shuffleOptions',
      'showCorrectAnswers',
      'allowReview',
      'dueDate',
      'timeLimit',
      'maxAttempts',
      'availableFrom',
      'availableUntil',
      'autoGrade',
      'gradingCriteria',
      'isPublished',
      'submissionCount',
      'averageScore',
      'createdAt',
      'updatedAt',
    ];

    fields.forEach(field => {
      transformed[field] = (this as any)[field];
    });

    return transformed;
  },
});

// Static Methods
quizSchema.statics.get = async function (id) {
  let quiz;

  if (mongoose.Types.ObjectId.isValid(id)) {
    try {
      quiz = await this.findById(id)
        .populate('course', 'title slug')
        .populate('createdBy', 'name email')
        .exec();
    } catch (error) {
      throw error;
    }
  }

  if (quiz) {
    return quiz;
  }

  throw new APIError({
    message: 'Quiz does not exist',
    status: httpStatus.NOT_FOUND,
  });
};

quizSchema.statics.list = async function ({
  page = 1,
  perPage = 30,
  course,
  module,
  isPublished,
  type,
}: any = {}) {
  const options: any = {};

  if (course) {
    options.course = course;
  }

  if (module) {
    options.module = module;
  }

  if (isPublished !== undefined) {
    options.isPublished = isPublished;
  }

  if (type) {
    options.type = type;
  }

  try {
    const quizzes = await this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .populate('course', 'title slug')
      .populate('createdBy', 'name email')
      .exec();

    const total = await this.countDocuments(options);

    return {
      quizzes,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  } catch (error) {
    throw error;
  }
};

// Get quiz statistics
quizSchema.statics.getStats = async function ({ quizId, courseId, startDate, endDate }: any = {}) {
  const User = mongoose.model('User');

  try {
    // Find quizzes based on filters
    let quizzes;
    if (quizId) {
      quizzes = [await this.findById(quizId).exec()];
    } else if (courseId) {
      quizzes = await this.find({ course: courseId }).exec();
    } else {
      quizzes = await this.find({}).exec();
    }

    const quizStats = await Promise.all(
      quizzes.map(async (quiz: any) => {
        // Get all user quiz submissions for this quiz
        const users: any = await User.find({
          'quizzes.quiz': quiz._id,
        }).exec();

        const submissions = users.flatMap((user: any) =>
          user.quizzes.filter((q: any) => q.quiz?.toString() === quiz._id?.toString())
        );

        // Filter by date if provided
        let filteredSubmissions = submissions;
        if (startDate || endDate) {
          filteredSubmissions = submissions.filter((s: any) => {
            const subDate = new Date(s.submittedAt);
            const isAfterStart = !startDate || subDate >= new Date(startDate);
            const isBeforeEnd = !endDate || subDate <= new Date(endDate);
            return isAfterStart && isBeforeEnd;
          });
        }

        const passCount = filteredSubmissions.filter((s: any) => s.passed).length;
        const failCount = filteredSubmissions.length - passCount;
        const averageScore =
          filteredSubmissions.length > 0
            ? filteredSubmissions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) /
              filteredSubmissions.length
            : 0;

        return {
          quizId: quiz._id,
          title: quiz.title,
          course: {
            courseId: quiz.course,
            title: quiz.course?.title || 'Unknown Course',
          },
          submissionCount: filteredSubmissions.length,
          averageScore: Math.round(averageScore * 100) / 100,
          passRate:
            filteredSubmissions.length > 0
              ? Math.round((passCount / filteredSubmissions.length) * 100 * 100) / 100
              : 0,
          passCount,
          failCount,
          totalPoints: quiz.totalPoints || 0,
          averagePointsEarned:
            filteredSubmissions.length > 0
              ? Math.round(
                  (filteredSubmissions.reduce((sum: number, s: any) => {
                    const earnedPoints = s.answers?.reduce((pSum: number, a: any) => pSum + (a.earnedPoints || 0), 0) || 0;
                    return sum + earnedPoints;
                  }, 0) / filteredSubmissions.length) * 100
                ) / 100
              : 0,
          timeTaken: {
            min:
              filteredSubmissions.length > 0
                ? Math.min(...filteredSubmissions.map((s: any) => s.timeTaken || 0))
                : 0,
            max:
              filteredSubmissions.length > 0
                ? Math.max(...filteredSubmissions.map((s: any) => s.timeTaken || 0))
                : 0,
            average:
              filteredSubmissions.length > 0
                ? Math.round(
                    (filteredSubmissions.reduce((sum: number, s: any) => sum + (s.timeTaken || 0), 0) /
                      filteredSubmissions.length) * 100
                  ) / 100
                : 0,
          },
          createdAt: quiz.createdAt,
        };
      })
    );

    // Calculate overall statistics
    const totalSubmissions = quizStats.reduce((sum: number, q: any) => sum + q.submissionCount, 0);
    const averageScore =
      quizStats.length > 0
        ? Math.round(
            (quizStats.reduce((sum: number, q: any) => sum + q.averageScore * q.submissionCount, 0) /
              totalSubmissions) *
              100
          ) / 100
        : 0;
    const averagePassRate =
      quizStats.length > 0
        ? Math.round((quizStats.reduce((sum: number, q: any) => sum + q.passRate, 0) / quizStats.length) * 100) / 100
        : 0;

    // Get unique participants
    const participantIds = new Set<string>();
    const User = mongoose.model('User');
    const allUsers: any = await User.find({}).exec();
    allUsers.forEach((user: any) => {
      if (user.quizzes && user.quizzes.length > 0) {
        participantIds.add(user._id.toString());
      }
    });

    return {
      totalQuizzes: quizStats.length,
      totalSubmissions,
      averageScore: isNaN(averageScore) ? 0 : averageScore,
      averagePassRate: isNaN(averagePassRate) ? 0 : averagePassRate,
      quizzes: quizStats,
      summary: {
        totalParticipants: participantIds.size,
        completionRate: participantIds.size > 0 ? Math.round((totalSubmissions / participantIds.size) * 100 * 100) / 100 : 0,
        mostDifficultQuiz:
          quizStats.length > 0
            ? quizStats.reduce((min: any, q: any) => (q.averageScore < (min.averageScore || 100) ? q : min))
            : null,
        easiestQuiz:
          quizStats.length > 0
            ? quizStats.reduce((max: any, q: any) => (q.averageScore > (max.averageScore || 0) ? q : max))
            : null,
      },
    };
  } catch (error) {
    throw error;
  }
};

export const Quiz = mongoose.model('Quiz', quizSchema);
