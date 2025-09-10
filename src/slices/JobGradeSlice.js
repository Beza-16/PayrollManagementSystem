import { createSlice, createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import axios, { CancelToken } from 'axios';
import { useCallback, useEffect, useRef } from 'react';

const baseUrl = 'https://localhost:14686/api/JobGrade';

const initialState = {
  jobGrades: [],
  page: 1,
  pageSize: 10,
  totalPages: 1,
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,
  successMessage: '',
  errorMessage: '',
};

const jobGradeSlice = createSlice({
  name: 'jobGrade',
  initialState,
  reducers: {
    setJobGrades: (state, action) => {
      state.jobGrades = action.payload.data;
      state.page = action.payload.page || 1;
      state.pageSize = action.payload.pageSize || 10;
      state.totalPages = action.payload.totalPages || 1;
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
  setJobGrades,
  setIsFetching,
  setIsSubmitting,
  setIsDeleting,
  setSuccessMessage,
  setErrorMessage,
  clearMessages,
} = jobGradeSlice.actions;

export const jobGradeReducer = jobGradeSlice.reducer;

const selectJobGrade = (state) => state.jobGrade || initialState;

export const selectJobGradeData = createSelector(
  [selectJobGrade],
  (jobGrade) => ({
    jobGrades: Array.isArray(jobGrade.jobGrades)
      ? jobGrade.jobGrades.map((g) => ({
          JobGradeID: g.JobGradeID || '',
          EmployeeID: g.EmployeeID || '',
          Grade: g.Grade || '',
          SalaryScale: g.SalaryScale ? Number(g.SalaryScale) : 0,
          CreatedAt: g.CreatedAt ? new Date(g.CreatedAt).toISOString() : null,
          UpdatedAt: g.UpdatedAt ? new Date(g.UpdatedAt).toISOString() : null,
        }))
      : [],
    page: jobGrade.page || 1,
    pageSize: jobGrade.pageSize || 10,
    totalPages: jobGrade.totalPages || 1,
    isFetching: jobGrade.isFetching || false,
    isSubmitting: jobGrade.isSubmitting || false,
    isDeleting: jobGrade.isDeleting || false,
    successMessage: jobGrade.successMessage || '',
    errorMessage: jobGrade.errorMessage || '',
  })
);

export const useJobGradeSlice = () => {
  const dispatch = useDispatch();
  const state = useSelector(selectJobGradeData);
  const cancelTokenSource = useRef(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const jobGradeAxios = axios.create({
    baseURL: baseUrl,
    timeout: 30000,
  });

  const fetchJobGrades = useCallback(async (page = 1, pageSize = 10) => {
    if (retryCount.current >= maxRetries) {
      dispatch(setErrorMessage(`Failed to fetch job grades after ${maxRetries} attempts.`));
      return;
    }

    dispatch(setIsFetching(true));
    dispatch(setErrorMessage(''));
    cancelTokenSource.current = CancelToken.source();

    try {
      const token = localStorage.getItem('token');
      console.log('fetchJobGrades - Token:', token || 'Missing');
      if (!token) {
        dispatch(setErrorMessage('Authentication required. Please log in.'));
        return;
      }

      const response = await jobGradeAxios.get('', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, pageSize, includeEmployee: true },
        cancelToken: cancelTokenSource.current.token,
      });

      console.log('fetchJobGrades - Raw API response:', JSON.stringify(response.data, null, 2));
      const grades = Array.isArray(response.data.Data) ? response.data.Data : [];
      const { totalRecords = 0, page: currentPage = 1, pageSize: responsePageSize = 10, totalPages = 1 } = response.data;

      const mappedGrades = grades.map((g) => ({
        JobGradeID: g.JobGradeID || '',
        EmployeeID: g.EmployeeID || '',
        Grade: g.Grade || '',
        SalaryScale: g.SalaryScale ? Number(g.SalaryScale) : 0,
        CreatedAt: g.CreatedAt ? new Date(g.CreatedAt).toISOString() : null,
        UpdatedAt: g.UpdatedAt ? new Date(g.UpdatedAt).toISOString() : null,
      }));

      dispatch(setJobGrades({
        data: mappedGrades,
        page: currentPage,
        pageSize: responsePageSize,
        totalPages,
      }));
      dispatch(setSuccessMessage('Job grades fetched successfully'));
      setTimeout(() => dispatch(setSuccessMessage('')), 5000);
      retryCount.current = 0; // Reset retry count on success
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('fetchJobGrades - Request cancelled');
        return;
      }
      const errorMsg = error.response
        ? `HTTP ${error.response.status}: ${error.response.data?.error || error.response.data?.title || error.response.statusText || 'Unknown error'}`
        : error.message;
      dispatch(setErrorMessage(errorMsg));
      retryCount.current += 1;
      setTimeout(() => fetchJobGrades(page, pageSize), 2000 * Math.pow(2, retryCount.current));
    } finally {
      dispatch(setIsFetching(false));
    }
  }, [dispatch]);

  const handleSubmit = useCallback(async (payload, isEditMode) => {
    if (!payload || !payload.EmployeeID || !payload.Grade || !payload.SalaryScale) {
      dispatch(setErrorMessage('Invalid payload: EmployeeID, Grade, and SalaryScale are required'));
      return;
    }

    dispatch(setIsSubmitting(true));
    dispatch(setErrorMessage(''));
    cancelTokenSource.current = CancelToken.source();

    try {
      const token = localStorage.getItem('token');
      console.log('handleSubmit - Token:', token || 'Missing');
      console.log('handleSubmit - Payload:', JSON.stringify(payload, null, 2));
      if (!token) {
        dispatch(setErrorMessage('Authentication required. Please log in.'));
        return;
      }

      const isEdit = isEditMode && payload.JobGradeID?.trim();
      const url = isEdit ? `/${payload.JobGradeID}` : '';

      const response = await jobGradeAxios({
        method: isEdit ? 'PUT' : 'POST',
        url,
        data: {
          EmployeeID: payload.EmployeeID,
          Grade: payload.Grade,
          SalaryScale: parseFloat(payload.SalaryScale),
        },
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        cancelToken: cancelTokenSource.current.token,
      });

      await fetchJobGrades(state.page, state.pageSize);
      dispatch(setSuccessMessage(isEdit ? 'Job grade updated' : 'Job grade added'));
      setTimeout(() => dispatch(setSuccessMessage('')), 5000);
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('handleSubmit - Request cancelled');
        return;
      }
      const errorMsg = error.response
        ? `HTTP ${error.response.status}: ${error.response.data?.error || error.response.data?.title || error.message}`
        : error.message;
      dispatch(setErrorMessage(errorMsg));
      setTimeout(() => dispatch(setErrorMessage('')), 5000);
      throw error;
    } finally {
      dispatch(setIsSubmitting(false));
    }
  }, [dispatch, fetchJobGrades, state.page, state.pageSize]);

  const handleDelete = useCallback(async (jobGradeId) => {
    if (!jobGradeId) {
      dispatch(setErrorMessage('Invalid job grade ID'));
      return;
    }

    dispatch(setIsDeleting(true));
    dispatch(setErrorMessage(''));
    cancelTokenSource.current = CancelToken.source();

    try {
      const token = localStorage.getItem('token');
      console.log('handleDelete - Token:', token || 'Missing');
      if (!token) {
        dispatch(setErrorMessage('Authentication required. Please log in.'));
        return;
      }

      await jobGradeAxios.delete(`/${jobGradeId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cancelToken: cancelTokenSource.current.token,
      });

      await fetchJobGrades(state.page, state.pageSize);
      dispatch(setSuccessMessage('Job grade deleted successfully'));
      setTimeout(() => dispatch(setSuccessMessage('')), 5000);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('handleDelete - Request cancelled');
        return;
      }
      const errorMsg = error.response
        ? `HTTP ${error.response.status}: ${error.response.data?.error || error.response.data?.title || error.message}`
        : error.message;
      dispatch(setErrorMessage(errorMsg));
      setTimeout(() => dispatch(setErrorMessage('')), 5000);
    } finally {
      dispatch(setIsDeleting(false));
    }
  }, [dispatch, fetchJobGrades, state.page, state.pageSize]);

  // Cleanup cancel token on unmount
  useEffect(() => {
    return () => {
      if (cancelTokenSource.current) {
        cancelTokenSource.current.cancel('Component unmounted');
      }
    };
  }, []);

  return {
    ...state,
    fetchJobGrades,
    handleSubmit,
    handleDelete,
    clearMessages: () => dispatch(clearMessages()),
  };
};