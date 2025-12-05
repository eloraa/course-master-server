import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { APIError } from '@/api/errors/api-error';

const batchSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // Course Association
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    // Timing
    startDate: {
      type: Date,
      index: true,
    },
    endDate: {
      type: Date,
      index: true,
    },

    // Created by
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Soft delete
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
batchSchema.index({ course: 1 });
batchSchema.index({ course: 1, startDate: 1 });

// Validation: endDate should be after startDate
batchSchema.pre('save', function() {
  if (this.endDate && this.startDate && this.endDate <= this.startDate) {
    throw new APIError({
      message: 'End date must be after start date',
      status: httpStatus.BAD_REQUEST,
    });
  }
});

// Instance Methods
batchSchema.method({
  transform() {
    const transformed: any = {};
    const fields = [
      'id',
      'name',
      'description',
      'course',
      'startDate',
      'endDate',
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
batchSchema.statics.get = async function (id) {
  let batch;

  if (mongoose.Types.ObjectId.isValid(id)) {
    try {
      batch = await this.findById(id)
        .populate('course', 'title slug')
        .populate('createdBy', 'name email')
        .exec();
    } catch (error) {
      throw error;
    }
  }

  if (batch) {
    return batch;
  }

  throw new APIError({
    message: 'Batch not found',
    status: httpStatus.NOT_FOUND,
  });
};

batchSchema.statics.list = async function ({
  page = 1,
  perPage = 30,
  course,
  search,
}: any = {}) {
  const options: any = { deletedAt: null };

  if (course) {
    options.course = course;
  }

  // Text search
  if (search) {
    options.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  try {
    const batches = await this.find(options)
      .populate('course', 'title slug')
      .sort({ startDate: 1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();

    const total = await this.countDocuments(options);

    return {
      batches,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  } catch (error) {
    throw error;
  }
};

export const Batch = mongoose.model('Batch', batchSchema);
export default Batch;