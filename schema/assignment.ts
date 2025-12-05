import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { APIError } from '@/api/errors/api-error';

const assignmentSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    instructions: {
      type: String,
      required: true,
    },

    // Association
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },

    // Assignment Settings
    type: {
      type: String,
      enum: ['text', 'file', 'link', 'code'],
      default: 'text',
    },
    maxScore: {
      type: Number,
      default: 100,
      min: 0,
    },
    passingScore: {
      type: Number,
      default: 60,
      min: 0,
    },

    // Deadlines
    dueDate: {
      type: Date,
    },
    allowLateSubmission: {
      type: Boolean,
      default: false,
    },
    latePenalty: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Resources & Attachments
    attachments: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],

    // Grading
    autoGrade: {
      type: Boolean,
      default: false,
    },
    gradingCriteria: {
      type: String,
    },

    // Status
    isPublished: {
      type: Boolean,
      default: false,
    },

    // Submissions count (denormalized)
    submissionCount: {
      type: Number,
      default: 0,
      min: 0,
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
assignmentSchema.index({ course: 1 });
assignmentSchema.index({ course: 1, module: 1 });
assignmentSchema.index({ isPublished: 1, createdAt: -1 });

// Instance Methods
assignmentSchema.method({
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
      'type',
      'maxScore',
      'passingScore',
      'dueDate',
      'allowLateSubmission',
      'latePenalty',
      'attachments',
      'autoGrade',
      'gradingCriteria',
      'isPublished',
      'submissionCount',
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
assignmentSchema.statics.get = async function (id) {
  let assignment;

  if (mongoose.Types.ObjectId.isValid(id)) {
    try {
      assignment = await this.findById(id)
        .populate('course', 'title slug')
        .populate('createdBy', 'name email')
        .exec();
    } catch (error) {
      throw error;
    }
  }

  if (assignment) {
    return assignment;
  }

  throw new APIError({
    message: 'Assignment does not exist',
    status: httpStatus.NOT_FOUND,
  });
};

assignmentSchema.statics.list = async function ({
  page = 1,
  perPage = 30,
  course,
  module,
  isPublished,
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

  try {
    const assignments = await this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .populate('course', 'title slug')
      .populate('createdBy', 'name email')
      .exec();

    const total = await this.countDocuments(options);

    return {
      assignments,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  } catch (error) {
    throw error;
  }
};

export const Assignment = mongoose.model('Assignment', assignmentSchema);
