import httpStatus from 'http-status';
import type { Request, Response, NextFunction } from 'express';
import { Order } from '@/schema/order';
import { Course } from '@/schema/course';
import { User } from '@/schema/user';

/**
 * Create a new order
 */
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    // Set user from authenticated user
    req.body.user = user._id;

    const order = new Order(req.body);
    const savedOrder: any = await order.save();

    // If order is completed, update user's enrolled courses
    if (savedOrder.status === 'completed' || savedOrder.payment?.status === 'completed') {
      const courseIds = savedOrder.items.map((item: any) => item.course);

      // Add courses to user's enrolledCourses
      await User.findByIdAndUpdate(user._id, {
        $addToSet: { enrolledCourses: { $each: courseIds } },
      });

      // Update course enrollment counts
      await Course.updateMany(
        { _id: { $in: courseIds } },
        { $inc: { totalEnrolled: 1 } }
      );
    }

    res.status(httpStatus.CREATED).json({
      status: httpStatus.CREATED,
      message: 'Order created successfully',
      data: savedOrder.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all orders with pagination and filters
 */
export const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, perPage = 30, user, status, paymentStatus, startDate, endDate } = req.query;

    const result: any = await (Order as any).list({
      page: Number(page),
      perPage: Number(perPage),
      user,
      status,
      paymentStatus,
      startDate,
      endDate,
    });

    res.json({
      status: httpStatus.OK,
      message: 'Orders retrieved successfully',
      data: result.orders.map((order: any) => order.transform()),
      pagination: {
        page: result.page,
        perPage: result.perPage,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by ID
 */
export const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await (Order as any).get(id);

    res.json({
      status: httpStatus.OK,
      message: 'Order retrieved successfully',
      data: order.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order by order number
 */
export const getByOrderNumber = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderNumber } = req.params;
    const order = await (Order as any).getByOrderNumber(orderNumber);

    res.json({
      status: httpStatus.OK,
      message: 'Order retrieved successfully',
      data: order.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's orders
 */
export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { page = 1, perPage = 30 } = req.query;

    const result: any = await (Order as any).list({
      page: Number(page),
      perPage: Number(perPage),
      user: user._id,
    });

    res.json({
      status: httpStatus.OK,
      message: 'Orders retrieved successfully',
      data: result.orders.map((order: any) => order.transform()),
      pagination: {
        page: result.page,
        perPage: result.perPage,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order
 */
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await (Order as any).get(id);

    Object.assign(order, req.body);
    const updatedOrder: any = await order.save();

    res.json({
      status: httpStatus.OK,
      message: 'Order updated successfully',
      data: updatedOrder.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 */
export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order: any = await (Order as any).get(id);

    if (status === 'completed' && order.status !== 'completed') {
      await order.markCompleted();

      // Add courses to user's enrolledCourses
      const courseIds = order.items.map((item: any) => item.course);
      await User.findByIdAndUpdate(order.user, {
        $addToSet: { enrolledCourses: { $each: courseIds } },
      });

      // Update course enrollment counts
      await Course.updateMany(
        { _id: { $in: courseIds } },
        { $inc: { totalEnrolled: 1 } }
      );
    } else if (status === 'cancelled') {
      await order.markCancelled();
    } else if (status === 'refunded') {
      await order.markRefunded();
    } else {
      order.status = status;
      await order.save();
    }

    res.json({
      status: httpStatus.OK,
      message: 'Order status updated successfully',
      data: order.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status: paymentStatus, transactionId, paidAt } = req.body;
    const order: any = await (Order as any).get(id);

    if (!order.payment) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: httpStatus.BAD_REQUEST,
        message: 'Order has no payment information',
      });
    }

    order.payment.status = paymentStatus;
    if (transactionId) order.payment.transactionId = transactionId;
    if (paidAt) order.payment.paidAt = new Date(paidAt);

    // If payment is completed, mark order as completed
    if (paymentStatus === 'completed' && order.status !== 'completed') {
      await order.markCompleted();

      // Add courses to user's enrolledCourses
      const courseIds = order.items.map((item: any) => item.course);
      await User.findByIdAndUpdate(order.user, {
        $addToSet: { enrolledCourses: { $each: courseIds } },
      });

      // Update course enrollment counts
      await Course.updateMany(
        { _id: { $in: courseIds } },
        { $inc: { totalEnrolled: 1 } }
      );
    } else {
      await order.save();
    }

    res.json({
      status: httpStatus.OK,
      message: 'Payment status updated successfully',
      data: order.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get order statistics
 */
export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await (Order as any).getStats({
      startDate,
      endDate,
    });

    res.json({
      status: httpStatus.OK,
      message: 'Order statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete order (admin only - soft delete by marking as cancelled)
 */
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order: any = await (Order as any).get(id);

    await order.markCancelled();

    res.json({
      status: httpStatus.OK,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  list,
  get,
  getByOrderNumber,
  getMyOrders,
  update,
  updateStatus,
  updatePaymentStatus,
  getStats,
  remove,
};
