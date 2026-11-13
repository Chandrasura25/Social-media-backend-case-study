import { Request } from 'express';

const MAX_LIMIT = 50;

/** Reads ?page and ?limit (1-based, limit capped at 50). */
export function paginate(req: Request, defaults = { page: 1, limit: 10 }) {
  const page = Math.max(1, parseInt(String(req.query.page), 10) || defaults.page);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit), 10) || defaults.limit));
  return { page, limit, skip: (page - 1) * limit };
}

export function paged<T>(data: T[], total: number, page: number, limit: number) {
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
}
