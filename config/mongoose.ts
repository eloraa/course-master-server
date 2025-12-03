import mongoose from 'mongoose';
import { logger } from './logger';
import { vars } from './vars';
import { Promise } from 'bluebird';

const { mongo, env } = vars;

// set mongoose Promise to Bluebird
mongoose.Promise = Promise;

// Exit application on error
mongoose.connection.on('error', err => {
  logger.error(`MongoDB connection error: ${err}`);
  process.exit(-1);
});

// print mongoose logs in dev env
if (env === 'development') {
  mongoose.set('debug', true);
}

export const connect = async () => {
  try {
    await mongoose.connect(mongo.uri!, {
      autoIndex: true,
    });
    console.log('mongoDB connected...');

    return mongoose.connection;
  } catch (err) {
    console.error("Couldn't connect to MongoDB\n", err);
  }
};
