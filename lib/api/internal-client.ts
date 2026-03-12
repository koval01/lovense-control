import axios from 'axios';

export const internalApiClient = axios.create({
  baseURL: '/',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function extractRequestError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const responseError =
      typeof error.response?.data === 'object' && error.response?.data
        ? (error.response.data as { error?: string }).error
        : undefined;
    return responseError || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
