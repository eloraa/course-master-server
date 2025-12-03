import { z } from 'zod';

const orderItemSchema = z.object({
  course: z.string(), // ObjectId as string
  title: z.string().min(1),
  price: z.number().min(0),
  discount: z.number().min(0).default(0),
});

const billingAddressSchema = z.object({
  fullName: z.string().min(1),
  email: z.email(),
  phone: z.string().optional(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().optional(),
  country: z.string().min(1),
  postalCode: z.string().min(1),
});

const paymentSchema = z.object({
  method: z.enum(['credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer', 'cash']),
  transactionId: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'refunded']).default('pending'),
  amount: z.number().min(0),
  currency: z.string().default('USD'),
  paymentDetails: z.any().optional(),
});

export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(orderItemSchema).min(1),
    subtotal: z.number().min(0),
    tax: z.number().min(0).default(0),
    discount: z.number().min(0).default(0),
    total: z.number().min(0),
    currency: z.string().default('USD'),
    couponCode: z.string().optional(),
    couponDiscount: z.number().min(0).default(0),
    payment: paymentSchema,
    billingAddress: billingAddressSchema,
    notes: z.string().optional(),
  }),
});

export const updateOrderSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'processing', 'completed', 'cancelled', 'refunded']).optional(),
    payment: paymentSchema.partial().optional(),
    notes: z.string().optional(),
    invoiceUrl: z.string().url().optional(),
  }),
});

export const getOrderSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.enum(['pending', 'processing', 'completed', 'cancelled', 'refunded']),
  }),
});

export const updatePaymentStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.enum(['pending', 'processing', 'completed', 'failed', 'refunded']),
    transactionId: z.string().optional(),
    paidAt: z.string().or(z.date()).optional(),
  }),
});
