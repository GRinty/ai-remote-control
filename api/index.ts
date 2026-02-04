/**
 * Vercel Serverless Function Entry Point
 */

import { createServer } from '../server/src/server';

const { app } = createServer();

export default app;
