import { Request, Response, NextFunction } from 'express';

export function validate(fn: (body: unknown) => void) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      fn(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateParams(fn: (params: unknown) => void) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      fn(req.params);
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function validateQuery(fn: (query: unknown) => void) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      fn(req.query);
      next();
    } catch (err) {
      next(err);
    }
  };
}
