import { logger } from './config/logger';
import { connect } from './config/mongoose';
import { vars } from './config/vars';
import app from './config/express';

const { env, port } = vars;

// open mongoose connection
connect();

// listen to requests
app.listen(port, () => logger.info(`server started on port ${port} (${env})`));

/**
 * Exports express
 * @public
 */
export { app };
