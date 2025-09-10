import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://localhost:14686';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

const CancelToken = axios.CancelToken;
let cancel;

const retry = async (fn, retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1 || err.code !== 'ERR_NETWORK') throw err;
      console.log(`Retry ${i + 1} for ${fn.name}`);
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
};

export const fetchRole = createAsyncThunk(
  'role/fetchRole',
  async (_, { rejectWithValue }) => {
    const fetch = async () => {
      const token = localStorage.getItem('token');
      console.log('Fetching roles with token:', token);
      const response = await axiosInstance.get('/api/Role', {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        cancelToken: new CancelToken((c) => (cancel = c)),
      });
      console.log('Roles response:', response.data);
      return Array.isArray(response.data)
        ? response.data.map((role) => ({
            value: role.RoleID?.toString() || '',
            label: role.RoleName || 'Unnamed Role',
          }))
        : [];
    };
    try {
      return await retry(fetch);
    } catch (err) {
      if (axios.isCancel(err)) {
        return rejectWithValue('Request cancelled');
      }
      console.error('Error fetching roles:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config,
      });
      if (err.code === 'ERR_NETWORK' || err.message.includes('ERR_EMPTY_RESPONSE')) {
        return rejectWithValue('Network error: Server did not respond. Ensure the backend is running at ' + API_BASE_URL + ' and allows requests from https://localhost:3002.');
      }
      if (err.response?.status === 401) {
        return rejectWithValue('Unauthorized: Please log in or refresh your session');
      }
      return rejectWithValue(err.response?.data?.error || 'Error fetching roles');
    }
  }
);

const roleSlice = createSlice({
  name: 'role',
  initialState: {
    roles: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRole.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default roleSlice.reducer;