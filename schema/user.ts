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

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const rounds = 10;
  const hash = await bcrypt.hash(this.password, rounds);
  this.password = hash;
});

userSchema.pre('updateOne', async function () {
  const update: any = this.getUpdate();
  if (!update.password) {
    return;
  }

  const rounds = 10;
  const hash = await bcrypt.hash(update.password, rounds);
  update.password = hash;
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

userSchema.statics.checkDuplicateEmail = function (error: any) {
  if (error.code === 11000) {
    return new APIError({
      message: 'Validation failed',
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

// Get user statistics
userSchema.statics.getStats = async function ({ role, startDate, endDate }: any = {}) {
  try {
    // Build match query
    const match: any = {};
    if (role) {
      match.role = role;
    }

    // Get total users
    const users = await this.find(match).exec();
    const studentCount = users.filter((u: any) => u.role === 'student').length;
    const adminCount = users.filter((u: any) => u.role === 'admin').length;

    // Calculate enrollment distribution
    const enrollmentDistribution = {
      '0_courses': 0,
      '1_5_courses': 0,
      '6_10_courses': 0,
      '10plus_courses': 0,
    };

    let totalEnrollments = 0;

    users.forEach((user: any) => {
      const enrollmentCount = user.enrolledCourses?.length || 0;
      totalEnrollments += enrollmentCount;

      if (enrollmentCount === 0) enrollmentDistribution['0_courses']++;
      else if (enrollmentCount <= 5) enrollmentDistribution['1_5_courses']++;
      else if (enrollmentCount <= 10) enrollmentDistribution['6_10_courses']++;
      else enrollmentDistribution['10plus_courses']++;
    });

    // Calculate active users (by last access)
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeUsers = {
      last24h: 0,
      last7d: 0,
      last30d: 0,
    };

    users.forEach((user: any) => {
      const progress = user.progress || [];
      if (progress.length === 0) return;

      const latest = progress.reduce((latest: any, p: any) => {
        const latest_time = latest?.lastAccessedAt ? new Date(latest.lastAccessedAt) : new Date(0);
        const current_time = p.lastAccessedAt ? new Date(p.lastAccessedAt) : new Date(0);
        return current_time > latest_time ? p : latest;
      });

      const lastAccessDate = new Date(latest?.lastAccessedAt);
      if (lastAccessDate && lastAccessDate.getTime() > 0) {
        if (lastAccessDate >= last24h) activeUsers.last24h++;
        if (lastAccessDate >= last7d) activeUsers.last7d++;
        if (lastAccessDate >= last30d) activeUsers.last30d++;
      }
    });

    // Calculate user engagement
    const engagement = {
      highEngagement: { count: 0, description: 'Users with 70%+ progress in at least one course' },
      mediumEngagement: { count: 0, description: 'Users with 30-70% progress' },
      lowEngagement: { count: 0, description: 'Users with <30% progress or no activity' },
    };

    users.forEach((user: any) => {
      const progress = user.progress || [];
      if (progress.length === 0) {
        engagement.lowEngagement.count++;
      } else {
        const maxProgress = Math.max(...progress.map((p: any) => p.percentage || 0), 0);
        if (maxProgress >= 70) {
          engagement.highEngagement.count++;
        } else if (maxProgress >= 30) {
          engagement.mediumEngagement.count++;
        } else {
          engagement.lowEngagement.count++;
        }
      }
    });

    // Get top courses by enrollment
    const courseEnrollments: any = {};
    const Course = mongoose.model('Course');

    users.forEach((user: any) => {
      user.enrolledCourses?.forEach((enrollment: any) => {
        const courseId = enrollment.course?.toString() || enrollment.course;
        courseEnrollments[courseId] = (courseEnrollments[courseId] || 0) + 1;
      });
    });

    const topCourseIds = Object.entries(courseEnrollments)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map((e: any) => e[0]);

    const topCourses = await Course.find({ _id: { $in: topCourseIds } })
      .select('title')
      .exec();

    const topCoursesByEnrollment = topCourseIds
      .map((courseId: string) => {
        const course = topCourses.find((c: any) => c._id.toString() === courseId);
        return {
          courseId,
          title: course?.title || 'Unknown Course',
          enrollmentCount: courseEnrollments[courseId],
        };
      });

    return {
      totalUsers: users.length,
      studentCount,
      adminCount,
      totalEnrollments,
      enrollmentDistribution,
      activeUsers,
      averageEnrollmentPerUser: users.length > 0 ? totalEnrollments / users.length : 0,
      userEngagement: engagement,
      topCoursesByEnrollment,
    };
  } catch (error) {
    throw error;
  }
};

export const User = mongoose.model('User', userSchema);
