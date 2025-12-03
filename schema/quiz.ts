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

export const Quiz = mongoose.model('Quiz', quizSchema);
