import express from 'express';
import compress from 'compression';
import methodOverride from 'method-override';
import cors from 'cors';
import passport from 'passport';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import { vars } from './vars';
import { jwt } from './passport';
import { converter, handler, notFound } from '@/api/middlewares/error';
import { router } from '@/api/routes/v1';

const { logs } = vars;

/**
 * Express instance
 */
const app = express();

// request logging. dev: console | production: file
app.use(morgan(logs));

// parse body params and attach them to req.body
// Support both JSON and form-data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Support multipart/form-data
const upload = multer();
app.use(upload.none()); // for parsing multipart/form-data without files

// gzip compression
app.use(compress());

// lets you use HTTP verbs such as PUT or DELETE
// in places where the client doesn't support it
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// enable authentication
app.use(passport.initialize());
passport.use('jwt', jwt);

// mount api v1 routes
app.use('/v1', router);

// if error is not an instanceOf APIError, convert it.
app.use(converter);

// catch 404 and forward to error handler
app.use(notFound);

// error handler, send stacktrace only during development
app.use(handler);

export default app;
