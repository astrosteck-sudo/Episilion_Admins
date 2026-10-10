import axios from 'axios';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// eslint-disable-next-line import/no-named-as-default-member -- axios.create is the documented API; the named `create` export is unrelated.
export const apiClient = axios.create({
  baseURL: API_URL,
  // Sends the httpOnly auth cookie on web. Harmless on native, which has no
  // cookie jar and uses the Authorization header instead.
  withCredentials: true,
  // No default Content-Type: axios already sends `application/json` for plain
  // objects, and forcing it here makes axios serialise FormData uploads to JSON
  // instead of multipart.
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear the whole session, not just the token: on web the credential is an
      // httpOnly cookie, so leaving the cached profile behind would restore a
      // dead session on the next launch.
      storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      storage.removeItem(STORAGE_KEYS.USER_ROLE);
      storage.removeItem(STORAGE_KEYS.USER_DATA);
    }
    return Promise.reject(error);
  }
);
