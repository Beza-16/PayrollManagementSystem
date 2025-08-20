// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import axios from 'axios';

// // Fetch roles from /api/Role
// export const fetchRole = createAsyncThunk(
//   'role/fetchRole',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await axios.get('https://localhost:14686/api/Role');
//       console.log('FetchRole - Raw API response:', response.data);
//       const mappedRoles = Array.isArray(response.data)
//         ? response.data.map((role) => ({
//             value: role.RoleId?.toString() || role.roleId?.toString(), // Handle camelCase or PascalCase
//             label: role.RoleName || role.roleName || 'Unnamed Role',
//           }))
//         : [];
//       console.log('FetchRole - Mapped roles:', mappedRoles);
//       return mappedRoles;
//     } catch (err) {
//       console.error('FetchRole - Error:', err.response?.data || err.message);
//       return rejectWithValue(err.response?.data?.error || 'Error fetching roles');
//     }
//   }
// );

// const roleSlice = createSlice({
//   name: 'role',
//   initialState: {
//     role: [],
//     loading: false,
//     error: null,
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchRole.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchRole.fulfilled, (state, action) => {
//         state.loading = false;
//         state.role = action.payload;
//       })
//       .addCase(fetchRole.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export default roleSlice.reducer;