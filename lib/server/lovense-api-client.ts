import axios from 'axios';

const lovenseApiClient = axios.create({
  baseURL: 'https://api.lovense-api.com/api/basicApi',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface LovenseResponse<TData> {
  code?: number;
  result?: boolean;
  message?: string;
  data?: TData;
}

interface GetTokenResponse {
  authToken?: string;
}

interface GetSocketUrlResponse {
  socketIoUrl?: string;
  socketIoPath?: string;
}

export async function requestLovenseAuthToken(params: {
  developerToken: string;
  uid: string;
  uname: string;
}): Promise<string> {
  const { data } = await lovenseApiClient.post<LovenseResponse<GetTokenResponse>>('/getToken', {
    token: params.developerToken,
    uid: params.uid,
    uname: params.uname,
  });

  if (data.code !== 0 || !data.data?.authToken) {
    throw new Error(data.message || 'Failed to get Lovense token');
  }

  return data.data.authToken;
}

export async function requestLovenseSocketUrl(authToken: string, platform: string): Promise<string> {
  const { data } = await lovenseApiClient.post<LovenseResponse<GetSocketUrlResponse>>('/getSocketUrl', {
    authToken,
    platform,
  });

  const isSuccess = data.code === 0 || data.result === true;
  if (!isSuccess || !data.data?.socketIoUrl || !data.data?.socketIoPath) {
    throw new Error(data.message || 'Failed to get socket URL from Lovense');
  }

  const urlObj = new URL(data.data.socketIoUrl);
  const ntoken = urlObj.searchParams.get('ntoken');
  if (!ntoken) {
    throw new Error('Lovense socket URL is missing ntoken');
  }

  return `wss://${urlObj.host}${data.data.socketIoPath}/?ntoken=${ntoken}&EIO=3&transport=websocket`;
}
