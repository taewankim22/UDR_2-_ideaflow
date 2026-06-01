import type { ErrorCode } from "@ideaflow/shared/types";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string
  ) {
    super(message);
  }
}
