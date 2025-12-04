import httpStatus from 'http-status';
import type { Request, Response, NextFunction } from 'express';
import { User } from '@/schema/user';
import { RefreshToken } from '@/schema/refresh-token';
import moment from 'moment-timezone';

/**
 * Returns a formatted token object
 */
const generateTokenResponse = (_user: any, accessToken: string) => {
  const tokenType = 'Bearer';
  const expiresIn = moment().add(process.env.JWT_EXPIRATION_MINUTES, 'minutes');
  return {
    tokenType,
    accessToken,
    expiresIn,
  };
};

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;

    // Check if this is the first user (make them admin automatically)
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    if (isFirstUser) {
      req.body.role = 'admin';
    } else if (role === 'admin') {
      // Only admins can create admin accounts
      const requestingUser = (req as any).user;
      if (!requestingUser || requestingUser.role !== 'admin') {
        return res.status(httpStatus.FORBIDDEN).json({
          message: 'Only administrators can create admin accounts',
        });
      }
    }

    const user = new User(req.body);
    const savedUser: any = await user.save();
    const userTransformed = savedUser.transform();
    const token = savedUser.token();

    res.status(httpStatus.CREATED).json({
      status: 'success',
      message: 'User created successfully.',
      token: generateTokenResponse(savedUser, token),
      user: userTransformed,
    });
  } catch (error) {
    next((User as any).checkDuplicateEmail(error));
  }
};

/**
 * Login with an existing user
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // if (!req.body || !req.body.email || !req.body.password) {
    //   return res.status(httpStatus.BAD_REQUEST).json({
    //     message: 'Email and password are required',
    //   });
    // }

    const { user, accessToken } = await (User as any).findAndGenerateToken(req.body);
    const token = generateTokenResponse(user, accessToken);
    const userTransformed = user.transform();

    return res.json({
      status: 'success',
      message: 'Logged in successfully.',
      token,
      user: userTransformed,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Refresh token
 */
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, refreshToken } = req.body;
    const refreshObject = await RefreshToken.findOne({
      userEmail: email,
      token: refreshToken,
    }).exec();

    if (!refreshObject) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: 'Invalid refresh token',
      });
    }

    const { user, accessToken } = await (User as any).findAndGenerateToken({
      email,
      refreshObject,
    });

    const response = generateTokenResponse(user, accessToken);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

export default { register, login, refresh };
