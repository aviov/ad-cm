import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class HttpException extends Error {
  status: number;
  message: string;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.message = message;
    this.errors = errors;
  }
}

export const errorMiddleware = (
  error: HttpException,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const status: number = error.status || 500;
    const message: string = error.message || 'Something went wrong';

    logger.error(
      `[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`,
      { 
        stack: error.stack,
        errors: error.errors 
      }
    );

    const response: any = {
      message,
      status,
      timestamp: new Date().toISOString(),
      path: req.path,
    };

    if (error.errors) {
      response.errors = error.errors;
    }

    res.status(status).json(response);
  } catch (err) {
    next(err);
  }
};

// 404 error middleware
export const notFoundMiddleware = (req: Request, res: Response) => {
  const message = `Resource not found: ${req.originalUrl}`;
  logger.warn(message);
  res.status(404).json({ message, status: 404 });
};