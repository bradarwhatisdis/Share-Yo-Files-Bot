export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class DownloadError extends AppError {
  constructor(message: string) {
    super(message, 'DOWNLOAD_ERROR', 500);
  }
}

export class TransferError extends AppError {
  constructor(message: string) {
    super(message, 'TRANSFER_ERROR', 500);
  }
}

export class QuotaExceededError extends AppError {
  constructor(message: string = 'Kuota harian Anda telah habis') {
    super(message, 'QUOTA_EXCEEDED', 403);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Anda tidak memiliki akses ke bot ini') {
    super(message, 'UNAUTHORIZED', 403);
  }
}

export class QueueFullError extends AppError {
  constructor(message: string = 'Antrean penuh, silakan coba lagi nanti') {
    super(message, 'QUEUE_FULL', 503);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource tidak ditemukan') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Terlalu banyak permintaan') {
    super(message, 'RATE_LIMIT', 429);
  }
}
