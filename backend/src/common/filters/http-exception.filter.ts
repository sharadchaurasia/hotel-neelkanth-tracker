import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * Global exception filter that catches all errors and returns user-friendly responses
 *
 * Handles:
 * - HTTP exceptions (validation, not found, etc.)
 * - Database errors (connection, query failures, constraints)
 * - Unexpected errors (server errors, null pointer, etc.)
 *
 * Returns consistent error format:
 * {
 *   statusCode: number,
 *   timestamp: string,
 *   path: string,
 *   method: string,
 *   message: string | string[],
 *   error?: string
 * }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error occurred';
    let errorName = 'InternalServerError';

    // Handle NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        errorName = responseObj.error || exception.name;
      }
    }
    // Handle TypeORM database errors
    else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      errorName = 'DatabaseError';

      const dbError = exception as any;

      // PostgreSQL unique constraint violation
      if (dbError.code === '23505') {
        message = 'This record already exists. Duplicate entry detected.';
      }
      // PostgreSQL foreign key violation
      else if (dbError.code === '23503') {
        message = 'Cannot perform this operation. Referenced record does not exist.';
      }
      // PostgreSQL not null violation
      else if (dbError.code === '23502') {
        message = 'Missing required field. Please provide all mandatory information.';
      }
      // General query error
      else {
        message = 'Database operation failed. Please check your input and try again.';
      }

      // Log the actual database error for debugging
      this.logger.error(
        `Database error: ${dbError.message}`,
        dbError.stack,
      );
    }
    // Handle unexpected errors
    else if (exception instanceof Error) {
      errorName = exception.name;
      message = 'An unexpected error occurred. Please try again.';

      // Log the full error for debugging
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
      );
    }
    // Handle unknown exceptions
    else {
      this.logger.error('Unknown exception occurred', JSON.stringify(exception));
    }

    // Build error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error: errorName,
    };

    // Log error (but not validation errors - they're expected)
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
