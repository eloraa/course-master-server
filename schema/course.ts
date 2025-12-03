import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { APIError } from '@/api/errors/api-error';

// Lesson Schema (nested within modules)
const lessonSchema = new mongoose.Schema(
  {
    lessonId: {
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
      enum: ['video', 'article', 'quiz', 'assignment'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      min: 0,
    },
    resources: [
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
    ],
    order: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

// Module Schema (nested within course)
const moduleSchema = new mongoose.Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
    },
    lessons: [lessonSchema],
  },
  { _id: false }
);

// Batch Schema (nested within course)
const batchSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    capacity: {
      type: Number,
      min: 0,
    },
    enrolledCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    priceOverride: {
      type: Number,
      min: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { _id: false }
);

// Main Course Schema
const courseSchema = new mongoose.Schema(
  {
    // Basic Information
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    fullDescription: {
      type: String,
      required: true,
    },

    // Categorization & Discovery
    category: {
      type: String,
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },

    // Pricing
    price: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },

    // Visibility & Status
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'public',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },

    // Media
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    promoVideoUrl: {
      type: String,
      trim: true,
    },

    // Course Details
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    language: {
      type: String,
      default: 'en',
    },
    duration: {
      type: Number,
      min: 0,
    },
    estimatedEffort: {
      type: String,
      trim: true,
    },
    courseType: {
      type: String,
      enum: ['self-paced', 'cohort', 'blended'],
      default: 'self-paced',
    },

    // Instructor & Ownership
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    coInstructors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Content Structure
    modules: [moduleSchema],

    // Batches & Scheduling
    batches: [batchSchema],

    // Enrollment & Sales
    totalEnrolled: {
      type: Number,
      default: 0,
      min: 0,
    },
    sales: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    coupons: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],

    // Assignments, Quizzes & Grading
    quizTemplates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
      },
    ],
    assignmentTemplates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
      },
    ],
    gradingPolicy: {
      type: mongoose.Schema.Types.Mixed,
    },

    // Ratings & Reviews
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // SEO & Metadata
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    keywords: {
      type: [String],
      default: [],
    },

    // Administrative & Operational
    internalNotes: {
      type: String,
    },
    tags_internal: {
      type: [String],
      default: [],
    },

    // Soft Delete
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for Performance
courseSchema.index({ title: 'text', shortDescription: 'text', fullDescription: 'text', tags: 'text' });
courseSchema.index({ slug: 1 }, { unique: true });
courseSchema.index({ category: 1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ isPublished: 1, createdAt: -1 });
courseSchema.index({ 'batches.startDate': 1 });

// Instance Methods
courseSchema.method({
  transform() {
    const transformed: any = {};
    const fields = [
      'id',
      'title',
      'slug',
      'shortDescription',
      'fullDescription',
      'category',
      'tags',
      'price',
      'currency',
      'isPublished',
      'visibility',
      'thumbnailUrl',
      'promoVideoUrl',
      'level',
      'language',
      'duration',
      'estimatedEffort',
      'courseType',
      'instructor',
      'coInstructors',
      'modules',
      'batches',
      'totalEnrolled',
      'ratingAverage',
      'ratingCount',
      'metaTitle',
      'metaDescription',
      'status',
      'createdAt',
      'updatedAt',
    ];

    fields.forEach(field => {
      transformed[field] = (this as any)[field];
    });

    return transformed;
  },

  // Calculate total duration from all lessons
  calculateTotalDuration() {
    let total = 0;
    (this as any).modules.forEach((module: any) => {
      module.lessons.forEach((lesson: any) => {
        if (lesson.duration) {
          total += lesson.duration;
        }
      });
    });
    return total;
  },

  // Update denormalized duration
  async updateDuration() {
    (this as any).duration = (this as any).calculateTotalDuration();
    await (this as any).save();
  },
});

// Static Methods
courseSchema.statics.get = async function (id) {
  let course;

  if (mongoose.Types.ObjectId.isValid(id)) {
    try {
      course = await this.findById(id)
        .populate('instructor', 'name email')
        .populate('coInstructors', 'name email')
        .exec();
    } catch (error) {
      throw error;
    }
  }

  if (course) {
    return course;
  }

  throw new APIError({
    message: 'Course does not exist',
    status: httpStatus.NOT_FOUND,
  });
};

courseSchema.statics.getBySlug = async function (slug: string) {
  try {
    const course = await this.findOne({ slug })
      .populate('instructor', 'name email')
      .populate('coInstructors', 'name email')
      .exec();

    if (course) {
      return course;
    }

    throw new APIError({
      message: 'Course does not exist',
      status: httpStatus.NOT_FOUND,
    });
  } catch (error) {
    throw error;
  }
};

courseSchema.statics.list = async function ({
  page = 1,
  perPage = 30,
  category,
  level,
  isPublished = true,
  minPrice,
  maxPrice,
  search,
}: any = {}) {
  const options: any = { isPublished };

  if (category) {
    options.category = category;
  }

  if (level) {
    options.level = level;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    options.price = {};
    if (minPrice !== undefined) options.price.$gte = minPrice;
    if (maxPrice !== undefined) options.price.$lte = maxPrice;
  }

  if (search) {
    options.$text = { $search: search };
  }

  try {
    const courses = await this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .populate('instructor', 'name email')
      .exec();

    const total = await this.countDocuments(options);

    return {
      courses,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  } catch (error) {
    throw error;
  }
};

courseSchema.statics.checkDuplicateSlug = function (error: any) {
  if (error.name === 'MongoError' && error.code === 11000) {
    return new APIError({
      message: 'Validation Error',
      errors: [
        {
          field: 'slug',
          location: 'body',
          messages: ['"slug" already exists'],
        },
      ],
      status: httpStatus.CONFLICT,
      isPublic: true,
      stack: error.stack,
    });
  }
  return error;
};

export const Course = mongoose.model('Course', courseSchema);
