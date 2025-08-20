// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// export const loginUser = createAsyncThunk('auth/loginUser', async ({ username, password }, { rejectWithValue }) => {
//   try {
//     const response = await axios.post('https://localhost:14686/api/auth/login', { username, password });
//     const token = response.data.token;
//     localStorage.setItem('token', token);
//     return token;
//   } catch (error) {
//     return rejectWithValue(error.response?.data || 'Login failed');
//   }
// });

// export const registerUser = createAsyncThunk('auth/registerUser', async (userData, { rejectWithValue }) => {
//   try {
//     const response = await axios.post('https://localhost:14686/api/auth/register', userData);
//     return response.data;
//   } catch (error) {
//     return rejectWithValue(error.response?.data || 'Registration failed');
//   }
// });

// /*
// export const validateToken = createAsyncThunk('auth/validateToken', async (_, { rejectWithValue }) => {
//   try {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       throw new Error('No token found');
//     }
//     const response = await axios.post('https://localhost:14686/api/auth/validate-token', { token }, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return token;
//   } catch (error) {
//     localStorage.removeItem('token');
//     return rejectWithValue(error.response?.data || 'Invalid or expired token');
//   }
// });
// */

// const authSlice = createSlice({
//   name: 'auth',
//   initialState: {
//     token: localStorage.getItem('token') || null,
//     isAuthenticated: false,
//     loading: false,
//     error: null,
//     successMessage: null,
//     isValidating: false, // Disabled validation
//   },
//   reducers: {
//     clearMessages: (state) => {
//       state.error = null;
//       state.successMessage = null;
//     },
//     logout: (state) => {
//       localStorage.removeItem('token');
//       state.token = null;
//       state.isAuthenticated = false;
//       state.isValidating = false;
//     },
//   },
//   extraReducers: (builder) => {
//     builder
//       .addCase(loginUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(loginUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.token = action.payload;
//         state.isAuthenticated = true;
//         state.isValidating = false;
//       })
//       .addCase(loginUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//         state.isAuthenticated = false;
//       })
//       .addCase(registerUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(registerUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.successMessage = action.payload || 'User registered successfully';
//       })
//       .addCase(registerUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//     /*
//     .addCase(validateToken.pending, (state) => {
//       state.isValidating = true;
//     })
//     .addCase(validateToken.fulfilled, (state, action) => {
//       state.isValidating = false;
//       state.token = action.payload;
//       state.isAuthenticated = true;
//     })
//     .addCase(validateToken.rejected, (state) => {
//       state.isValidating = false;
//       state.token = null;
//       state.isAuthenticated = false;
//     });
//     */
//   },
// });

// export const { clearMessages, logout } = authSlice.actions;
// export default authSlice.reducer;



















import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post('https://localhost:14686/api/auth/login', { email, password });
      const { token, redirectTo } = response.data;
      localStorage.setItem('token', token);
      return { token, redirectTo };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Login failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ username, email, password, roleId }, { rejectWithValue }) => {
    try {
      const response = await axios.post('https://localhost:14686/api/auth/register', {
        username,
        email,
        password,
        roleId,
      });
      return response.data.message;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Registration failed';
      return rejectWithValue(errorMessage);
    }
  }
);

export const validateToken = createAsyncThunk(
  'auth/validateToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      await axios.post(
        'https://localhost:14686/api/auth/validate-token',
        { token },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return token;
    } catch (error) {
      localStorage.removeItem('token');
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Invalid or expired token';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchUserRole = createAsyncThunk(
  'auth/fetchUserRole',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const response = await axios.get('https://localhost:14686/api/auth/user-role', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.role;
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to fetch user role';
      return rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('token') || null,
    isAuthenticated: false,
    loading: false,
    error: null,
    successMessage: null,
    isValidating: false,
    userRole: null,
    redirectTo: null,
  },
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    logout: (state) => {
      localStorage.removeItem('token');
      state.token = null;
      state.isAuthenticated = false;
      state.isValidating = false;
      state.userRole = null;
      state.redirectTo = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.redirectTo = action.payload.redirectTo;
        state.isAuthenticated = true;
        state.isValidating = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(validateToken.pending, (state) => {
        state.isValidating = true;
        state.error = null;
      })
      .addCase(validateToken.fulfilled, (state, action) => {
        state.isValidating = false;
        state.token = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(validateToken.rejected, (state, action) => {
        state.isValidating = false;
        state.token = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      .addCase(fetchUserRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserRole.fulfilled, (state, action) => {
        state.loading = false;
        state.userRole = action.payload;
      })
      .addCase(fetchUserRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMessages, logout } = authSlice.actions;
export default authSlice.reducer;