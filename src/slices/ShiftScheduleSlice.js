import { createSlice, createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import axios, { CancelToken } from 'axios';
import { useCallback, useRef } from 'react';

const baseUrl = 'https://localhost:14686/api/ShiftSchedule';

const initialState = {
  shiftSchedules: [],
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,
  successMessage: '',
  errorMessage: '',
};

const shiftScheduleSlice = createSlice({
  name: 'shiftSchedule',
  initialState,
  reducers: {
    setShiftSchedules: (state, action) => {
      state.shiftSchedules = action.payload;
    },
    setIsFetching: (state, action) => {
      state.isFetching = action.payload;
    },
    setIsSubmitting: (state, action) => {
      state.isSubmitting = action.payload;
    },
    setIsDeleting: (state, action) => {
      state.isDeleting = action.payload;
    },
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;
    },
    setErrorMessage: (state, action) => {
      state.errorMessage = action.payload;
    },
    clearMessages: (state) => {
      state.successMessage = '';
      state.errorMessage = '';
    },
  },
});

export const {
  setShiftSchedules,
  setIsFetching,
  setIsSubmitting,
  setIsDeleting,
  setSuccessMessage,
  setErrorMessage,
  clearMessages,
} = shiftScheduleSlice.actions;

export const shiftScheduleReducer = shiftScheduleSlice.reducer;

const selectShiftSchedule = (state) => state.shiftSchedule || initialState;

export const selectShiftScheduleData = createSelector(
  [selectShiftSchedule],
  (shiftSchedule) => shiftSchedule
);

export const useShiftScheduleSliceWithRedux = () => {
  const dispatch = useDispatch();
  const state = useSelector(selectShiftScheduleData);
  const cancelTokenSource = useRef(null);

  const shiftScheduleAxios = axios.create({
    baseURL: baseUrl,
    timeout: 30000,
  });

  const fetchShiftSchedules = useCallback(async () => {
    dispatch(setIsFetching(true));
    dispatch(setErrorMessage(''));
    cancelTokenSource.current = CancelToken.source();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch(setErrorMessage('Authentication required. Please log in.'));
        return;
      }

      const response = await shiftScheduleAxios.get('', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 1, pageSize: 100 },
        cancelToken: cancelTokenSource.current.token,
      });

      const schedules = Array.isArray(response.data?.Data) ? response.data.Data : [];

      const mappedSchedules = schedules.map((s) => ({
        ShiftID: s.ShiftID || '',
        EmployeeID: s.EmployeeID || '',
        ShiftType: s.ShiftType || 'Unspecified',
        StartTime: s.StartTime || null,
        EndTime: s.EndTime || null,
        CreatedAt: s.CreatedAt ? new Date(s.CreatedAt).toISOString() : null,
        UpdatedAt: s.UpdatedAt ? new Date(s.UpdatedAt).toISOString() : null,
      }));

      dispatch(setShiftSchedules(mappedSchedules));
      dispatch(setSuccessMessage('Shift schedules fetched successfully'));
      setTimeout(() => dispatch(setSuccessMessage('')), 5000);
    } catch (error) {
      const errorMsg = error.response
        ? `HTTP ${error.response.status}: ${error.response.data?.error || error.response.data?.title || error.response.statusText}`
        : error.message;
      dispatch(setErrorMessage(errorMsg));
    } finally {
      dispatch(setIsFetching(false));
    }
  }, [dispatch]);

  const handleSubmit = useCallback(async (payload, isEditMode) => {
    dispatch(setIsSubmitting(true));
    dispatch(setErrorMessage(''));
    cancelTokenSource.current = CancelToken.source();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch(setErrorMessage('Authentication required. Please log in.'));
        return;
      }

      const isEdit = isEditMode && payload.ShiftID?.trim() !== '';
      const url = isEdit ? `/${payload.ShiftID}` : '';

      const response = await shiftScheduleAxios({
        method: isEdit ? 'PUT' : 'POST',
        url,
        data: payload,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        cancelToken: cancelTokenSource.current.token,
      });

      await fetchShiftSchedules(); // refresh list
      dispatch(setSuccessMessage(isEdit ? 'Shift schedule updated' : 'Shift schedule added'));
      setTimeout(() => dispatch(setSuccessMessage('')), 5000);
      return response.data;
    } catch (error) {
      dispatch(setErrorMessage(error.message));
      setTimeout(() => dispatch(setErrorMessage('')), 5000);
      throw error;
    } finally {
      dispatch(setIsSubmitting(false));
    }
  }, [dispatch, fetchShiftSchedules]);

  const handleDelete = useCallback(async (shiftId) => {
    if (!shiftId) {
      dispatch(setErrorMessage('Invalid shift ID'));
      return;
    }

    dispatch(setIsDeleting(true));
    dispatch(setErrorMessage(''));
    cancelTokenSource.current = CancelToken.source();

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch(setErrorMessage('Authentication required. Please log in.'));
        return;
      }

      await shiftScheduleAxios.delete(`/${shiftId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cancelToken: cancelTokenSource.current.token,
      });

      await fetchShiftSchedules(); // refresh after delete
      dispatch(setSuccessMessage('Shift schedule deleted successfully'));
      setTimeout(() => dispatch(setSuccessMessage('')), 5000);
    } catch (error) {
      dispatch(setErrorMessage(`Failed to delete: ${error.message}`));
      setTimeout(() => dispatch(setErrorMessage('')), 5000);
    } finally {
      dispatch(setIsDeleting(false));
    }
  }, [dispatch, fetchShiftSchedules]);

  return {
    ...state,
    fetchShiftSchedules,
    handleSubmit,
    handleDelete,
    clearMessages: () => dispatch(clearMessages()),
  };
};
