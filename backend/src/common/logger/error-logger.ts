import { Logger } from '@nestjs/common';

/**
 * Error logging utility for consistent error tracking across services
 *
 * Usage:
 *   ErrorLogger.logServiceError('BookingsService', 'create', error, { guestName: 'John' });
 */
export class ErrorLogger {
  private static readonly logger = new Logger('ErrorLogger');

  /**
   * Log service-level errors with context
   *
   * @param serviceName - Name of the service (e.g., 'BookingsService')
   * @param methodName - Name of the method where error occurred
   * @param error - The error object
   * @param context - Additional context data (guest name, booking ID, etc.)
   */
  static logServiceError(
    serviceName: string,
    methodName: string,
    error: any,
    context?: Record<string, any>,
  ): void {
    const errorMessage = error?.message || 'Unknown error';
    const contextStr = context ? JSON.stringify(context) : '';

    this.logger.error(
      `[${serviceName}.${methodName}] ${errorMessage} ${contextStr}`,
      error?.stack,
    );
  }

  /**
   * Log database operation errors
   */
  static logDatabaseError(
    operation: string,
    tableName: string,
    error: any,
    data?: any,
  ): void {
    const errorMessage = error?.message || 'Unknown database error';
    const dataStr = data ? JSON.stringify(data) : '';

    this.logger.error(
      `[Database.${operation}] Table: ${tableName} - ${errorMessage} ${dataStr}`,
      error?.stack,
    );
  }

  /**
   * Log payment-related errors (high priority)
   */
  static logPaymentError(
    operation: string,
    bookingId: string,
    amount: number,
    error: any,
  ): void {
    this.logger.error(
      `[PAYMENT ERROR] Operation: ${operation} | BookingId: ${bookingId} | Amount: ₹${amount} | Error: ${error?.message}`,
      error?.stack,
    );
  }

  /**
   * Log general info (non-errors)
   */
  static logInfo(message: string, context?: string): void {
    this.logger.log(`${message}${context ? ' - ' + context : ''}`);
  }
}
