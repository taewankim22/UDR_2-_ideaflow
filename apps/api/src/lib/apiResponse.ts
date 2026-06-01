import type { Response } from "express";
import type { ApiResponse, ErrorCode } from "@ideaflow/shared/types";

export function ok<T>(
  res: Response,
  data: T,
  meta?: { nextCursor?: string },
  status = 200
) {
  const body: ApiResponse<T> = meta ? { success: true, data, meta } : { success: true, data };
  return res.status(status).json(body);
}

export function fail(res: Response, status: number, code: ErrorCode, message: string) {
  const body: ApiResponse<never> = {
    success: false,
    error: { code, message }
  };
  return res.status(status).json(body);
}
