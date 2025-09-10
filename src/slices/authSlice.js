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
    isAuthenticated: !!localStorage.getItem('token'), // Initialize based on token
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
        state.userRole = null;
        state.redirectTo = null;
        state.error = action.payload;
        localStorage.removeItem('token');
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



















// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// export const loginUser = createAsyncThunk(
//   'auth/loginUser',
//   async ({ email, password }, { rejectWithValue }) => {
//     try {
//       const response = await axios.post('https://localhost:14686/api/auth/login', { email, password });
//       const { token, redirectTo } = response.data;
//       localStorage.setItem('token', token);
//       return { token, redirectTo };
//     } catch (error) {
//       const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Login failed';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// export const registerUser = createAsyncThunk(
//   'auth/registerUser',
//   async ({ username, email, password, roleId }, { rejectWithValue }) => {
//     try {
//       const response = await axios.post('https://localhost:14686/api/auth/register', {
//         username,
//         email,
//         password,
//         roleId,
//       });
//       return response.data.message;
//     } catch (error) {
//       const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Registration failed';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// export const validateToken = createAsyncThunk(
//   'auth/validateToken',
//   async (_, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         throw new Error('No token found');
//       }
//       await axios.post(
//         'https://localhost:14686/api/auth/validate-token',
//         { token },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       return token;
//     } catch (error) {
//       localStorage.removeItem('token');
//       const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Invalid or expired token';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// export const fetchUserRole = createAsyncThunk(
//   'auth/fetchUserRole',
//   async (_, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) throw new Error('No token found');
//       const response = await axios.get('https://localhost:14686/api/auth/user-role', {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       return response.data.role;
//     } catch (error) {
//       const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to fetch user role';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// const authSlice = createSlice({
//   name: 'auth',
//   initialState: {
//     token: localStorage.getItem('token') || null,
//     isAuthenticated: false,
//     loading: false,
//     error: null,
//     successMessage: null,
//     isValidating: false,
//     userRole: null,
//     redirectTo: null,
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
//       state.userRole = null;
//       state.redirectTo = null;
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
//         state.token = action.payload.token;
//         state.redirectTo = action.payload.redirectTo;
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
//         state.successMessage = action.payload;
//       })
//       .addCase(registerUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       .addCase(validateToken.pending, (state) => {
//         state.isValidating = true;
//         state.error = null;
//       })
//       .addCase(validateToken.fulfilled, (state, action) => {
//         state.isValidating = false;
//         state.token = action.payload;
//         state.isAuthenticated = true;
//       })
//       .addCase(validateToken.rejected, (state, action) => {
//         state.isValidating = false;
//         state.token = null;
//         state.isAuthenticated = false;
//         state.error = action.payload;
//       })
//       .addCase(fetchUserRole.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchUserRole.fulfilled, (state, action) => {
//         state.loading = false;
//         state.userRole = action.payload;
//       })
//       .addCase(fetchUserRole.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export const { clearMessages, logout } = authSlice.actions;
// export default authSlice.reducer;








// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// export const loginUser = createAsyncThunk(
//   'auth/loginUser',
//   async ({ email, password }, { rejectWithValue }) => {
//     try {
//       const response = await axios.post('https://localhost:14686/api/auth/login', { email, password });
//       const { token, redirectTo } = response.data;
//       localStorage.setItem('token', token);
//       return { token, redirectTo };
//     } catch (error) {
//       const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Login failed';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// export const registerUser = createAsyncThunk(
//   'auth/registerUser',
//   async ({ username, email, password, roleId }, { rejectWithValue }) => {
//     try {
//       const response = await axios.post('https://localhost:14686/api/auth/register', {
//         username,
//         email,
//         password,
//         roleId,
//       });
//       return response.data.message;
//     } catch (error) {
//       const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Registration failed';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// export const validateToken = createAsyncThunk(
//   'auth/validateToken',
//   async (_, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         throw new Error('No token found');
//       }
//       await axios.post(
//         'https://localhost:14686/api/auth/validate-token',
//         { token },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       return token;
//     } catch (error) {
//       localStorage.removeItem('token');
//       const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Invalid or expired token';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// export const fetchUserRole = createAsyncThunk(
//   'auth/fetchUserRole',
//   async (_, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) throw new Error('No token found');
//       const response = await axios.get('https://localhost:14686/api/auth/user-role', {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       return response.data.role;
//     } catch (error) {
//       const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to fetch user role';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// export const fetchUser = createAsyncThunk(
//   'auth/fetchUser',
//   async (_, { rejectWithValue }) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) throw new Error('No token found');
//       const response = await axios.get('https://localhost:14686/api/auth/me', {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       return { userId: response.data.userId, username: response.data.username };
//     } catch (error) {
//       const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to fetch user data';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );

// const authSlice = createSlice({
//   name: 'auth',
//   initialState: {
//     token: localStorage.getItem('token') || null,
//     isAuthenticated: !!localStorage.getItem('token'),
//     loading: false,
//     error: null,
//     successMessage: null,
//     isValidating: false,
//     userRole: null,
//     redirectTo: null,
//     user: null,
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
//       state.userRole = null;
//       state.redirectTo = null;
//       state.user = null;
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
//         state.token = action.payload.token;
//         state.redirectTo = action.payload.redirectTo;
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
//         state.successMessage = action.payload;
//       })
//       .addCase(registerUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       .addCase(validateToken.pending, (state) => {
//         state.isValidating = true;
//         state.error = null;
//       })
//       .addCase(validateToken.fulfilled, (state, action) => {
//         state.isValidating = false;
//         state.token = action.payload;
//         state.isAuthenticated = true;
//       })
//       .addCase(validateToken.rejected, (state, action) => {
//         state.isValidating = false;
//         state.token = null;
//         state.isAuthenticated = false;
//         state.userRole = null;
//         state.redirectTo = null;
//         state.user = null;
//         state.error = action.payload;
//         localStorage.removeItem('token');
//       })
//       .addCase(fetchUserRole.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchUserRole.fulfilled, (state, action) => {
//         state.loading = false;
//         state.userRole = action.payload;
//       })
//       .addCase(fetchUserRole.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       .addCase(fetchUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.user = action.payload;
//       })
//       .addCase(fetchUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// // Export reducer actions and thunks
// export const { clearMessages, logout } = authSlice.actions;
// export default authSlice.reducer;