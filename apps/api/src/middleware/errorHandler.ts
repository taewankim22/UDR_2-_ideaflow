import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { fail } from "../lib/apiResponse.js";
import { AppError } from "../lib/appError.js";

export function notFoundHandler(_req: Request, res: Response) {
  return fail(res, 404, "NOT_FOUND", "요청한 API를 찾을 수 없습니다.");
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    return fail(res, error.status, error.code, error.message);
  }

  if (error instanceof ZodError) {
    return fail(res, 400, "VALIDATION_ERROR", error.errors[0]?.message ?? "입력값을 확인해주세요.");
  }

  console.error(error);
  return fail(res, 503, "AI_UNAVAILABLE", "서비스를 처리하는 중 문제가 발생했습니다.");
}
