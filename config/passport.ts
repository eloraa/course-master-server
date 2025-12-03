import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import type { VerifiedCallback } from 'passport-jwt';
import { vars } from './vars';
import { User } from '@/schema/user';
const { jwtSecret } = vars;

const jwtOptions = {
  secretOrKey: jwtSecret!,
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
};

const JWT = async (payload: any, done: VerifiedCallback) => {
  try {
    const user = await User.findById(payload.sub);
    if (user) return done(null, user);
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
};

export const jwt = new JwtStrategy(jwtOptions, JWT);
