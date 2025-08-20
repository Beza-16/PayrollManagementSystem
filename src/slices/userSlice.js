import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = 'https://localhost:14686';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Fetch employees to populate dropdown
export const fetchEmployeesThunk = createAsyncThunk(
  'user/fetchEmployees',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found in localStorage for /api/Employee request');
        return rejectWithValue('Please log in to access employee data');
      }
      const response = await axiosInstance.get('/api/Employee', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mappedEmployees = response.data.map((employee) => ({
        ...employee,
        City: employee.City || 'N/A',
        Country: employee.Country || 'N/A',
        EmployeeID: employee.EmployeeID || '',
        FullName: employee.FullName || employee.Name || 'N/A',
        Email: employee.Email || 'N/A',
      }));
      return mappedEmployees;
    } catch (err) {
      console.error('Error fetching employees:', err.response?.status, err.response?.data || err.message);
      if (err.response?.status === 401) {
        return rejectWithValue('Unauthorized: Please log in or refresh your session');
      }
      return rejectWithValue(err.response?.data?.error || 'Error fetching employees');
    }
  }
);

// Fetch roles
export const fetchRoleThunk = createAsyncThunk(
  'user/fetchRole',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get('/api/Role', {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      const rolesData = Array.isArray(response.data) ? response.data : response.data?.data || [];
      const mappedRoles = rolesData.map((role) => ({
        id: role.RoleID?.toString() || '',
        name: role.RoleName || 'Unnamed Role',
      }));
      return mappedRoles;
    } catch (err) {
      console.error('Error fetching roles:', err.response?.status, err.response?.data || err.message);
      if (err.response?.status === 401) {
        return rejectWithValue('Unauthorized: Please log in or refresh your session');
      }
      return rejectWithValue(err.response?.data?.error || 'Error fetching roles');
    }
  }
);

// Fetch all users
export const fetchUsersThunk = createAsyncThunk(
  'user/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token found in localStorage for /api/users request');
        return rejectWithValue('Please log in to access user data');
      }
      const response = await axiosInstance.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const users = response.data.map(user => ({
        ...user,
        RoleName: user.Role?.RoleName || 'N/A',
        Employee: user.Employee?.FullName || 'N/A',
      }));
      return users;
    } catch (err) {
      console.error('Error fetching users:', err.response?.status, err.response?.data || err.message);
      if (err.response?.status === 401) {
        return rejectWithValue('Unauthorized: Please log in or refresh your session');
      }
      return rejectWithValue(err.response?.data?.error || 'Error fetching users');
    }
  }
);

// Register user
export const registerUserThunk = createAsyncThunk(
  'user/registerUser',
  async ({ userData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.post('/api/users', userData, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      return { userId: response.data.userId, password: response.data.defaultPassword, userData };
    } catch (err) {
      console.error('Registration error:', err.response?.status, err.response?.data || err.message);
      return rejectWithValue(err.response?.data?.error || 'Error creating user account');
    }
  }
);

// Custom hook
export const useUserSlice = () => {
  const dispatch = useDispatch();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timeoutIds = useRef([]);
  const lastMessage = useRef({ success: '', error: '' });
  const isFetching = useRef(false);

  const { employees, roles, users, loading, roleLoading, error, roleError, successMessage: sliceSuccessMessage } = useSelector(
    (state) => state.user || {
      employees: [],
      roles: [],
      users: [],
      loading: false,
      roleLoading: false,
      error: null,
      roleError: null,
      successMessage: null,
    }
  );

  const fetchEmployees = useCallback(async () => {
    if (isFetching.current || employees.length > 0) return;
    isFetching.current = true;
    setErrorMessage('');
    try {
      await dispatch(fetchEmployeesThunk()).unwrap();
    } catch (error) {
      setErrorMessage(error || 'Failed to fetch employees');
    } finally {
      isFetching.current = false;
    }
  }, [dispatch, employees.length]);

  const fetchRoles = useCallback(async () => {
    if (isFetching.current || roles.length > 0) return;
    isFetching.current = true;
    setErrorMessage('');
    try {
      await dispatch(fetchRoleThunk()).unwrap();
    } catch (error) {
      setErrorMessage(error || 'Failed to fetch roles');
    } finally {
      isFetching.current = false;
    }
  }, [dispatch, roles.length]);

  const fetchUsers = useCallback(async () => {
    if (isFetching.current || users.length > 0) return;
    isFetching.current = true;
    setErrorMessage('');
    try {
      await dispatch(fetchUsersThunk()).unwrap();
    } catch (error) {
      setErrorMessage(error || 'Failed to fetch users');
    } finally {
      isFetching.current = false;
    }
  }, [dispatch, users.length]);

  const handleSubmit = useCallback(
    async (userData) => {
      setIsSubmitting(true);
      setErrorMessage('');
      const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
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
    fetchEmployees();
    fetchRoles();
    fetchUsers();
  }, [fetchEmployees, fetchRoles, fetchUsers]);

  useEffect(() => {
    const newError = error || roleError;
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
  }, [sliceSuccessMessage, error, roleError]);

  return {
    employees,
    roles,
    users,
    loading,
    roleLoading,
    error: errorMessage || error || roleError,
    successMessage,
    isSubmitting,
    fetchEmployees,
    fetchRoles,
    fetchUsers,
    handleSubmit,
  };
};

const userSlice = createSlice({
  name: 'user',
  initialState: {
    employees: [],
    roles: [],
    users: [],
    loading: false,
    roleLoading: false,
    error: null,
    roleError: null,
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
      .addCase(fetchRoleThunk.pending, (state) => {
        state.roleLoading = true;
        state.roleError = null;
      })
      .addCase(fetchRoleThunk.fulfilled, (state, action) => {
        state.roleLoading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoleThunk.rejected, (state, action) => {
        state.roleLoading = false;
        state.roleError = action.payload;
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