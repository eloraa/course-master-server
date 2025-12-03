import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import moment from 'moment-timezone';
import jwt from 'jwt-simple';
import httpStatus from 'http-status';

import { vars } from '@/config/vars';
import { APIError } from '@/api/errors/api-error';
const { jwtSecret, jwtExpirationInterval } = vars;

const roles = ['student', 'admin'];

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    name: {
      type: String,
      required: true,
      maxlength: 50,
      minlength: 3,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      match: /^\S+@\S+\.\S+$/,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 128,
    },
    role: {
      type: String,
      enum: roles,
      default: 'student',
    },

    // Enrollment Information
    enrolledCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
          required: true,
        },
        batch: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Batch',
          required: true,
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Progress Tracking
    progress: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
          required: true,
        },
        completedLessons: [
          {
            lessonId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Lesson',
              required: true,
            },
            completedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        percentage: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
      },
    ],

    // Assignments
    assignments: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
          required: true,
        },
        moduleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Module',
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        reviewed: {
          type: Boolean,
          default: false,
        },
        grade: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
    ],

    // Quiz Submissions
    quizzes: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
          required: true,
        },
        moduleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Module',
          required: true,
        },
        score: {
          type: Number,
          required: true,
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1 });

// @ts-ignore - Mongoose pre-hook typing
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) {
      // @ts-ignore
      next();
      return;
    }

    const rounds = 10;
    const hash = await bcrypt.hash(this.password, rounds);
    this.password = hash;

    // @ts-ignore
    next();
  } catch (error: any) {
    // @ts-ignore
    next(error);
  }
});

// @ts-ignore - Mongoose pre-hook typing
userSchema.pre('updateOne', async function (next) {
  try {
    const update: any = this.getUpdate();
    if (!update.password) {
      // @ts-ignore
      next();
      return;
    }

    const rounds = 10;
    const hash = await bcrypt.hash(update.password, rounds);
    update.password = hash;

    // @ts-ignore
    next();
  } catch (error: any) {
    // @ts-ignore
    next(error);
  }
});

userSchema.method({
  transform() {
    const transformed: any = {};
    const fields = ['id', 'name', 'email', 'role', 'enrolledCourses', 'progress', 'assignments', 'quizzes', 'createdAt'];

    fields.forEach(field => {
      transformed[field] = (this as any)[field];
    });

    return transformed;
  },
  token() {
    const payload = {
      exp: moment().add(jwtExpirationInterval, 'minutes').unix(),
      iat: moment().unix(),
      sub: (this as any)._id,
    };
    return jwt.encode(payload, jwtSecret!);
  },
  async passwordMatches(password: string) {
    return bcrypt.compare(password, (this as any).password);
  },
});

userSchema.statics.get = async function (id) {
  let user;

  if (mongoose.Types.ObjectId.isValid(id)) {
    try {
      user = await this.findById(id).exec();
    } catch (error) {
      throw error;
    }
  }
  if (user) {
    return user;
  }

  throw new APIError({
    message: 'User does not exist',
    status: httpStatus.NOT_FOUND,
  });
};

userSchema.statics.checkDuplicateEmail = function (error) {
  if (error.name === 'MongoError' && error.code === 11000) {
    return new APIError({
      message: 'Validation Error',
      errors: [
        {
          field: 'email',
          location: 'body',
          messages: ['"email" already exists'],
        },
      ],
      status: httpStatus.CONFLICT,
      isPublic: true,
      stack: error.stack,
    });
  }
  return error;
};

userSchema.statics.findAndGenerateToken = async function (options: any) {
  const { email, password, refreshObject } = options;
  if (!email)
    throw new APIError({
      message: 'An email is required to generate a token',
    });

  const user: any = await this.findOne({
    email,
  }).exec();
  const err: any = {
    status: httpStatus.UNAUTHORIZED,
    isPublic: true,
    message: '',
  };
  if (password) {
    if (user && (await user.passwordMatches(password))) {
      return {
        user,
        accessToken: user.token(),
      };
    }
    err.message = 'Incorrect email or password';
  } else if (refreshObject && refreshObject.userEmail === email) {
    if (moment(refreshObject.expires).isBefore()) {
      err.message = 'Invalid refresh token.';
    } else {
      return {
        user,
        accessToken: user.token(),
      };
    }
  } else {
    err.message = 'Incorrect email or refreshToken';
  }
  throw new APIError(err);
};

(userSchema.statics as any).roles = roles;

export const User = mongoose.model('User', userSchema);
