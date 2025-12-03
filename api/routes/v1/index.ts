import express from 'express';

export const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (_, res) => res.send('OK'));
