import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { APIError } from '@/api/errors/api-error';

const resourceSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  { _id: true }
);

const lessonSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: true,
      trim: true,
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
      ref: 'Module',
      required: true,
      index: true,
    },

    // Lesson Type & Content
    type: {
      type: String,
      enum: ['video', 'article', 'quiz', 'assignment'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },

    // Duration (in minutes)
    duration: {
      type: Number,
      min: 0,
    },

    // Resources
    resources: [resourceSchema],

    // Ordering
    order: {
      type: Number,
      required: true,
      min: 0,
    },

    // Status
    isPublished: {
      type: Boolean,
      default: false,
    },

    // Reference to quiz or assignment if applicable
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
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
lessonSchema.index({ course: 1, module: 1, order: 1 });
lessonSchema.index({ module: 1, isPublished: 1 });
lessonSchema.index({ type: 1 });

// Instance Methods
lessonSchema.method({
  transform() {
    const transformed: any = {};
    const fields = [
      'id',
      'title',
      'course',
      'module',
      'type',
      'content',
      'duration',
      'resources',
      'order',
      'isPublished',
      'quiz',
      'assignment',
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
lessonSchema.statics.get = async function (id) {
  let lesson;

  if (mongoose.Types.ObjectId.isValid(id)) {
    try {
      lesson = await this.findById(id)
        .populate('course', 'title slug')
        .populate('module', 'title')
        .populate('quiz', 'title')
        .populate('assignment', 'title')
        .populate('createdBy', 'name email')
        .exec();
    } catch (error) {
      throw error;
    }
  }

  if (lesson) {
    return lesson;
  }

  throw new APIError({
    message: 'Lesson does not exist',
    status: httpStatus.NOT_FOUND,
  });
};

lessonSchema.statics.list = async function ({
  page = 1,
  perPage = 30,
  course,
  module,
  type,
  isPublished,
}: any = {}) {
  const options: any = {};

  if (course) {
    options.course = course;
  }

  if (module) {
    options.module = module;
  }

  if (type) {
    options.type = type;
  }

  if (isPublished !== undefined) {
    options.isPublished = isPublished;
  }

  try {
    const lessons = await this.find(options)
      .sort({ order: 1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .populate('course', 'title slug')
      .populate('module', 'title')
      .populate('quiz', 'title')
      .populate('assignment', 'title')
      .populate('createdBy', 'name email')
      .exec();

    const total = await this.countDocuments(options);

    return {
      lessons,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  } catch (error) {
    throw error;
  }
};

export const Lesson = mongoose.model('Lesson', lessonSchema);
