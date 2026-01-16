import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface UseApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: any;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Custom hook for handling API calls with loading, error states, and toast notifications
 * 
 * @example
 * const { data, loading, error, execute } = useApi(agentsService.getAgents, {
 *   showErrorToast: true,
 *   showSuccessToast: false
 * });
 * 
 * // Call the API
 * await execute({ page: 1, per_page: 20 });
 */
export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage,
    onSuccess,
    onError,
  } = options;

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);

        const result = await apiFunction(...args);
        setData(result);

        if (showSuccessToast) {
          toast.success(successMessage || 'Operation completed successfully');
        }

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err: any) {
        setError(err);

        if (showErrorToast) {
          const errorMessage = err?.message || 'An error occurred';
          toast.error(errorMessage);

          // Show validation errors if available
          if (err?.errors) {
            Object.keys(err.errors).forEach((field) => {
              const messages = err.errors[field];
              if (Array.isArray(messages)) {
                messages.forEach((msg) => toast.error(`${field}: ${msg}`));
              }
            });
          }
        }

        if (onError) {
          onError(err);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, showSuccessToast, showErrorToast, successMessage, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
