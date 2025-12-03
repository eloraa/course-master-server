import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { APIError } from '@/api/errors/api-error';

const moduleSchema = new mongoose.Schema(
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

    // Association
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },

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

    // Denormalized counts
    lessonCount: {
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
moduleSchema.index({ course: 1, order: 1 });
moduleSchema.index({ course: 1, isPublished: 1 });

// Instance Methods
moduleSchema.method({
  transform() {
    const transformed: any = {};
    const fields = [
      'id',
      'title',
      'description',
      'course',
      'order',
      'isPublished',
      'lessonCount',
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
moduleSchema.statics.get = async function (id) {
  let module;

  if (mongoose.Types.ObjectId.isValid(id)) {
    try {
      module = await this.findById(id)
        .populate('course', 'title slug')
        .populate('createdBy', 'name email')
        .exec();
    } catch (error) {
      throw error;
    }
  }

  if (module) {
    return module;
  }

  throw new APIError({
    message: 'Module does not exist',
    status: httpStatus.NOT_FOUND,
  });
};

moduleSchema.statics.list = async function ({
  page = 1,
  perPage = 30,
  course,
  isPublished,
}: any = {}) {
  const options: any = {};

  if (course) {
    options.course = course;
  }

  if (isPublished !== undefined) {
    options.isPublished = isPublished;
  }

  try {
    const modules = await this.find(options)
      .sort({ order: 1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .populate('course', 'title slug')
      .populate('createdBy', 'name email')
      .exec();

    const total = await this.countDocuments(options);

    return {
      modules,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  } catch (error) {
    throw error;
  }
};

export const Module = mongoose.model('Module', moduleSchema);
