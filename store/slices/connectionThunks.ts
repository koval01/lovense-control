import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { extractRequestError, internalApiClient } from '@/lib/api/internal-client';

interface InitSessionResponse {
  authToken: string;
  uid: string;
}

interface SocketUrlResponse {
  wsUrl: string;
}

export const initializeLovenseSession = createAsyncThunk<
  { wsUrl: string },
  void,
  { rejectValue: string }
>('connection/initializeLovenseSession', async (_, { rejectWithValue }) => {
  try {
    await internalApiClient.get('/api/session');
    let socketAuth: InitSessionResponse;
    try {
      const response = await internalApiClient.post<InitSessionResponse>('/api/lovense/socket', {});
      socketAuth = response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await internalApiClient.get('/api/session');
        const retryResponse = await internalApiClient.post<InitSessionResponse>('/api/lovense/socket', {});
        socketAuth = retryResponse.data;
      } else {
        throw error;
      }
    }

    const { data: socketUrl } = await internalApiClient.post<SocketUrlResponse>('/api/lovense/socket-url', {
      authToken: socketAuth.authToken,
    });

    if (!socketUrl.wsUrl) {
      return rejectWithValue('Failed to initialize socket URL');
    }

    return { wsUrl: socketUrl.wsUrl };
  } catch (error) {
    return rejectWithValue(extractRequestError(error, 'Failed to initialize session'));
  }
});
