import { app } from '../src/serverApp.js';

// Vercel Serverless Function entry point
export default function handler(req: any, res: any) {
  return app(req, res);
}
