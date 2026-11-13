import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import router from './routes';
import { HttpError } from './utils/httpError';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/uploads', express.static(path.resolve('uploads')));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', router);

  app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ message: err.message });
      return;
    }
    if (err && typeof err === 'object' && (err as any).name === 'CastError') {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    if (err && typeof err === 'object' && (err as any).name === 'MulterError') {
      res.status(400).json({ message: (err as Error).message });
      return;
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  });

  return app;
}
