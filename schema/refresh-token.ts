import mongoose from 'mongoose';
import crypto from 'crypto';
import moment from 'moment-timezone';

const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

refreshTokenSchema.statics.generate = async function (user: any) {
  const userId = user._id;
  const userEmail = user.email;
  const token = `${userId}.${crypto.randomBytes(40).toString('hex')}`;
  const expires = moment().add(30, 'days').toDate();
  const tokenObject = new this({
    token,
    userId,
    userEmail,
    expires,
  });
  await tokenObject.save();
  return tokenObject;
};

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
