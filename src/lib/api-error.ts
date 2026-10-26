import axios from 'axios';

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, opts: { status?: number; code?: string } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code;
  }
}

type ServerErrorBody = {
  statusCode?: number;
  code?: string;
  message?: string | string[];
};

export function toApiError(error: unknown): Error {
  if (axios.isCancel(error)) return new ApiError('You need to sign in to continue.');

  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new ApiError('Something went wrong.');
  }

  if (error.code === 'ECONNABORTED') {
    return new ApiError('The request timed out. Please try again.');
  }
  if (error.code === 'ERR_NETWORK' || !error.response) {
    return new ApiError('You appear to be offline. Please check your connection and try again.');
  }

  const data = error.response.data as ServerErrorBody | undefined;
  // NestJS-style APIs can return message as string[] for validation errors
  const serverMessage = Array.isArray(data?.message) ? data.message.join(', ') : data?.message;

  return new ApiError(serverMessage || 'Something went wrong. Please try again.', {
    status: error.response.status,
    code: data?.code,
  });
}
