import { Request } from 'express';

interface PaginationOptions {
  page?: number;
  limit?: number;
}

export const paginate = (req: Request, options: PaginationOptions = {}) => {
  const { page = 1, limit = 10 } = options;
  const parsedPage = parseInt(req.query.page as string) || page;
  const parsedLimit = parseInt(req.query.limit as string) || limit;
  const skip = (parsedPage - 1) * parsedLimit;

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip,
  };
};
