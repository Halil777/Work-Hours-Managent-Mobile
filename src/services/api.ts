import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://mock.local', // häzirçe mock
  timeout: 10000,
});
