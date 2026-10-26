import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ApiError } from './api-error';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ApiError) {
      this.logger.warn(`${exception.code} HTTP ${exception.statusCode}`);
      response.status(exception.statusCode).json({
        code: exception.code,
        message: exception.message,
        details: exception.details,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const raw = typeof body === 'string' ? body : (body as { message?: string | string[] }).message;
      const text = Array.isArray(raw) ? raw.join(' ') : raw || 'Request could not be processed.';
      const code = status === 429 ? 'RATE_LIMITED' : 'INVALID_REQUEST';
      const message = status === 429 ? 'Too many requests. Wait a moment and try again.' : String(text).slice(0, 300);
      this.logger.warn(`${code} HTTP ${status}`);
      response.status(status).json({ code, message });
      return;
    }

    const message = exception instanceof Error ? exception.message : 'Unknown server error';
    this.logger.error(message);
    response.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'The server could not complete this request.',
    });
  }
}
