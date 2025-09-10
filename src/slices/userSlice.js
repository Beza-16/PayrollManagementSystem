import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { useState, useEffect, useCallback, useRef } from 'react';

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

export const fetchEmployeesThunk = createAsyncThunk(
  'user/fetchEmployees',
  async (_, { rejectWithValue }) => {
    const fetch = async () => {
      const token = localStorage.getItem('token');
      console.log('Fetching employees with token:', token);
      if (!token) {
        throw new Error('Please log in to access employee data');
      }
      const response = await axiosInstance.get('/api/Employee', {
        headers: { Authorization: `Bearer ${token}` },
        cancelToken: new CancelToken((c) => (cancel = c)),
      });
      console.log('Employees response:', response.data);
      return response.data.map((employee) => ({
        ...employee,
        City: employee.City || 'N/A',
        Country: employee.Country || 'N/A',
        EmployeeID: employee.EmployeeID || '',
        FullName: employee.FullName || employee.Name || 'N/A',
        Email: employee.Email || 'N/A',
      }));
    };
    try {
      return await retry(fetch);
    } catch (err) {
      if (axios.isCancel(err)) {
        return rejectWithValue('Request cancelled');
      }
      console.error('Error fetching employees:', {
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
      return rejectWithValue(err.response?.data?.error || 'Error fetching employees');
    }
  }
);

export const fetchUsersThunk = createAsyncThunk(
  'user/fetchUsers',
  async (_, { rejectWithValue }) => {
    const fetch = async () => {
      const token = localStorage.getItem('token');
      console.log('Fetching users with token:', token);
      if (!token) {
        throw new Error('Please log in to access user data');
      }
      const response = await axiosInstance.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
        cancelToken: new CancelToken((c) => (cancel = c)),
      });
      console.log('Users response:', response.data);
      return response.data.map((user) => ({
        ...user,
        RoleName: user.Role?.RoleName || 'N/A',
        Employee: user.Employee?.FullName || 'N/A',
      }));
    };
    try {
      return await retry(fetch);
    } catch (err) {
      if (axios.isCancel(err)) {
        return rejectWithValue('Request cancelled');
      }
      console.error('Error fetching users:', {
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
      return rejectWithValue(err.response?.data?.error || 'Error fetching users');
    }
  }
);

export const registerUserThunk = createAsyncThunk(
  'user/registerUser',
  async ({ userData }, { rejectWithValue }) => {
    const fetch = async () => {
      const token = localStorage.getItem('token');
      console.log('Registering user with token:', token);
      const response = await axiosInstance.post('/api/users', userData, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        cancelToken: new CancelToken((c) => (cancel = c)),
      });
      console.log('Register user response:', response.data);
      return { userId: response.data.userId, password: response.data.defaultPassword, userData };
    };
    try {
      return await retry(fetch);
    } catch (err) {
      if (axios.isCancel(err)) {
        return rejectWithValue('Request cancelled');
      }
      console.error('Registration error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config,
      });
      if (err.code === 'ERR_NETWORK' || err.message.includes('ERR_EMPTY_RESPONSE')) {
        return rejectWithValue('Network error: Server did not respond. Ensure the backend is running at ' + API_BASE_URL + ' and allows requests from https://localhost:3002.');
      }
      return rejectWithValue(err.response?.data?.error || 'Error creating user account');
    }
  }
);

export const useUserSlice = () => {
  const dispatch = useDispatch();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timeoutIds = useRef([]);
  const lastMessage = useRef({ success: '', error: '' });

  const { employees, users, loading, error, successMessage: sliceSuccessMessage } = useSelector(
    (state) => state.user || {
      employees: [],
      users: [],
      loading: false,
      error: null,
      successMessage: null,
    }
  );

  const fetchEmployees = useCallback(async () => {
    if (employees.length > 0) return;
    setErrorMessage('');
    try {
      await dispatch(fetchEmployeesThunk()).unwrap();
    } catch (error) {
      setErrorMessage(error || 'Failed to fetch employees');
    }
  }, [dispatch, employees.length]);

  const fetchUsers = useCallback(async () => {
    if (users.length > 0) return;
    setErrorMessage('');
    try {
      await dispatch(fetchUsersThunk()).unwrap();
    } catch (error) {
      setErrorMessage(error || 'Failed to fetch users');
    }
  }, [dispatch, users.length]);

  const handleSubmit = useCallback(
    async (userData) => {
      setIsSubmitting(true);
      setErrorMessage('');
      const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 30000);
      timeoutIds.current.push(timeoutId);
      try {
        const cleanedUserData = {
          Username: userData.Username,
          Email: userData.Email,
          Password: userData.Password,
          RoleId: userData.RoleId,
          EmployeeId: userData.EmployeeId || null,
        };
        const response = await dispatch(registerUserThunk({ userData: cleanedUserData })).unwrap();
        setSuccessMessage(`User created successfully. Default Password: ${response.password}`);
        const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
        timeoutIds.current.push(successTimeout);
        return response;
      } catch (error) {
        setErrorMessage(error || 'Failed to create user');
        const errorTimeout = setTimeout(() => setErrorMessage(''), 10000);
        timeoutIds.current.push(errorTimeout);
        throw error;
      } finally {
        setIsSubmitting(false);
        clearTimeout(timeoutId);
        timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
      }
    },
    [dispatch]
  );

  useEffect(() => {
    const fetchData = async () => {
      await fetchEmployees();
      await fetchUsers();
    };
    fetchData();
    return () => {
      if (cancel) cancel();
      timeoutIds.current.forEach(clearTimeout);
    };
  }, [fetchEmployees, fetchUsers]);

  useEffect(() => {
    const newError = error;
    const newSuccess = sliceSuccessMessage;

    if (newSuccess && newSuccess !== lastMessage.current.success) {
      setSuccessMessage(newSuccess);
      lastMessage.current.success = newSuccess;
      const timeoutId = setTimeout(() => {
        setSuccessMessage('');
        lastMessage.current.success = '';
      }, 10000);
      timeoutIds.current.push(timeoutId);
    }

    if (newError && newError !== lastMessage.current.error) {
      setErrorMessage(newError);
      lastMessage.current.error = newError;
      const timeoutId = setTimeout(() => {
        setErrorMessage('');
        lastMessage.current.error = '';
      }, 10000);
      timeoutIds.current.push(timeoutId);
    }

    return () => timeoutIds.current.forEach(clearTimeout);
  }, [sliceSuccessMessage, error]);

  return {
    employees,
    users,
    loading,
    error: errorMessage || error,
    successMessage,
    isSubmitting,
    fetchEmployees,
    fetchUsers,
    handleSubmit,
  };
};

const userSlice = createSlice({
  name: 'user',
  initialState: {
    employees: [],
    users: [],
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployeesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUsersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(registerUserThunk.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = 'User account created successfully!';
      })
      .addCase(registerUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default userSlice.reducer;