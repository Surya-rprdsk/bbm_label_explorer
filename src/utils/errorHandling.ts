/**
 * Error handling utilities for BBM Label Explorer
 */

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  DATA_PARSING = 'DATA_PARSING',
  STORAGE = 'STORAGE',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

// Error severities
export enum ErrorSeverity {
  CRITICAL = 'CRITICAL',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  originalError?: Error;
  retryable: boolean;
  statusCode?: number;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    originalError?: Error,
    retryable = true,
    statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.originalError = originalError;
    this.retryable = retryable;
    this.statusCode = statusCode;
  }
}

/**
 * Factory function to create a network error
 */
export function createNetworkError(
  message: string,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  originalError?: Error,
  retryable = true
): AppError {
  return new AppError(
    message,
    ErrorType.NETWORK,
    severity,
    originalError,
    retryable
  );
}

/**
 * Factory function to create an API error
 */
export function createApiError(
  message: string,
  statusCode?: number,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  originalError?: Error,
  retryable = true
): AppError {
  const error = new AppError(
    message,
    ErrorType.API,
    severity,
    originalError,
    retryable,
    statusCode
  );
  return error;
}

/**
 * Factory function to create a data parsing error
 */
export function createDataParsingError(
  message: string,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  originalError?: Error,
  retryable = false
): AppError {
  return new AppError(
    message,
    ErrorType.DATA_PARSING,
    severity,
    originalError,
    retryable
  );
}

/**
 * Factory function to create a storage error
 */
export function createStorageError(
  message: string,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  originalError?: Error,
  retryable = false
): AppError {
  return new AppError(
    message,
    ErrorType.STORAGE,
    severity,
    originalError,
    retryable
  );
}

/**
 * Factory function to create a timeout error
 */
export function createTimeoutError(
  message: string,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  originalError?: Error,
  retryable = true
): AppError {
  return new AppError(
    message,
    ErrorType.TIMEOUT,
    severity,
    originalError,
    retryable
  );
}

/**
 * Factory function to create an unknown error
 */
export function createUnknownError(
  message: string,
  severity: ErrorSeverity = ErrorSeverity.ERROR,
  originalError?: Error,
  retryable = false
): AppError {
  return new AppError(
    message,
    ErrorType.UNKNOWN,
    severity,
    originalError,
    retryable
  );
}

/**
 * Helper function to retry an operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  onRetry?: (attempt: number, error: AppError) => void
): Promise<T> {
  let attempt = 0;
  
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      
      // If the error is not an AppError, convert it
      const appError = error instanceof AppError
        ? error
        : createUnknownError(
            error instanceof Error ? error.message : 'Unknown error occurred',
            ErrorSeverity.ERROR,
            error instanceof Error ? error : undefined
          );
      
      // If the error is not retryable or we've exceeded max retries, throw
      if (!appError.retryable || attempt >= maxRetries) {
        throw appError;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      
      // Call the onRetry callback if provided
      if (onRetry) {
        onRetry(attempt, appError);
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Handles an error by logging it and optionally taking additional actions
 */
export function handleError(
  error: unknown,
  context: string,
): AppError {
  const appError = error instanceof AppError
    ? error
    : createUnknownError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        ErrorSeverity.ERROR,
        error instanceof Error ? error : undefined
      );
  
  // Log the error with context
  console.error(`[AILabelAssist][ERROR][${context}] ${appError.message}`, appError);
  
  // If notifyUser is true, you might want to show a notification or update UI
  // This would typically be handled by the component that calls this function
  
  return appError;
}
