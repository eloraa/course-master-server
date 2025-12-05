// @ts-nocheck
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import { APIError } from '@/api/errors/api-error';

const orderItemSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true }
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer', 'cash'],
      required: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paidAt: {
      type: Date,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentDetails: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // Order Number (unique identifier)
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Order Items
    items: [orderItemSchema],

    // Pricing
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },

    // Coupon
    couponCode: {
      type: String,
      trim: true,
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Order Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },

    // Payment Information
    payment: paymentSchema,

    // Billing Information
    billingAddress: {
      fullName: String,
      email: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },

    // Notes
    notes: {
      type: String,
    },

    // Timestamps for status changes
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },

    // Invoice
    invoiceUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });

// Pre-save hook to generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${count + 1}`;
  }
  next();
});

// Instance Methods
orderSchema.method({
  transform() {
    const transformed: any = {};
    const fields = [
      'id',
      'orderNumber',
      'user',
      'items',
      'subtotal',
      'tax',
      'discount',
      'total',
      'currency',
      'couponCode',
      'couponDiscount',
      'status',
      'payment',
      'billingAddress',
      'notes',
      'completedAt',
      'cancelledAt',
      'refundedAt',
      'invoiceUrl',
      'createdAt',
      'updatedAt',
    ];

    fields.forEach(field => {
      transformed[field] = (this as any)[field];
    });

    return transformed;
  },

  // Mark order as completed
  async markCompleted() {
    (this as any).status = 'completed';
    (this as any).completedAt = new Date();
    if ((this as any).payment) {
      (this as any).payment.status = 'completed';
      (this as any).payment.paidAt = new Date();
    }
    await (this as any).save();
  },

  // Mark order as cancelled
  async markCancelled() {
    (this as any).status = 'cancelled';
    (this as any).cancelledAt = new Date();
    await (this as any).save();
  },

  // Mark order as refunded
  async markRefunded() {
    (this as any).status = 'refunded';
    (this as any).refundedAt = new Date();
    if ((this as any).payment) {
      (this as any).payment.status = 'refunded';
    }
    await (this as any).save();
  },
});

// Static Methods
orderSchema.statics.get = async function (id) {
  let order;

  if (mongoose.Types.ObjectId.isValid(id)) {
    try {
      order = await this.findById(id)
        .populate('user', 'name email')
        .populate('items.course', 'title slug thumbnailUrl')
        .exec();
    } catch (error) {
      throw error;
    }
  }

  if (order) {
    return order;
  }

  throw new APIError({
    message: 'Order does not exist',
    status: httpStatus.NOT_FOUND,
  });
};

orderSchema.statics.getByOrderNumber = async function (orderNumber: string) {
  try {
    const order = await this.findOne({ orderNumber })
      .populate('user', 'name email')
      .populate('items.course', 'title slug thumbnailUrl')
      .exec();

    if (order) {
      return order;
    }

    throw new APIError({
      message: 'Order does not exist',
      status: httpStatus.NOT_FOUND,
    });
  } catch (error) {
    throw error;
  }
};

orderSchema.statics.list = async function ({
  page = 1,
  perPage = 30,
  user,
  status,
  paymentStatus,
  startDate,
  endDate,
}: any = {}) {
  const options: any = {};

  if (user) {
    options.user = user;
  }

  if (status) {
    options.status = status;
  }

  if (paymentStatus) {
    options['payment.status'] = paymentStatus;
  }

  if (startDate || endDate) {
    options.createdAt = {};
    if (startDate) options.createdAt.$gte = new Date(startDate);
    if (endDate) options.createdAt.$lte = new Date(endDate);
  }

  try {
    const orders = await this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .populate('user', 'name email')
      .populate('items.course', 'title slug thumbnailUrl')
      .exec();

    const total = await this.countDocuments(options);

    return {
      orders,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  } catch (error) {
    throw error;
  }
};

// Calculate order statistics
orderSchema.statics.getStats = async function ({ startDate, endDate }: any = {}) {
  const match: any = { status: 'completed' };

  if (startDate || endDate) {
    match.completedAt = {};
    if (startDate) match.completedAt.$gte = new Date(startDate);
    if (endDate) match.completedAt.$lte = new Date(endDate);
  }

  try {
    const stats = await this.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' },
        },
      },
    ]);

    return stats[0] || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
  } catch (error) {
    throw error;
  }
};

export const Order = mongoose.model('Order', orderSchema);
