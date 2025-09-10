import { createSlice, createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import axios, { CancelToken } from 'axios';
import { useCallback, useEffect, useRef } from 'react';

const baseUrl = 'https://localhost:14686/api/Contract';

const initialState = {
  contracts: [],
  page: 1,
  pageSize: 10,
  totalPages: 1,
  isFetching: false,
  isSubmitting: false,
  isDeleting: false,
  successMessage: '',
  errorMessage: '',
};

const contractSlice = createSlice({
  name: 'contract',
  initialState,
  reducers: {
    setContracts: (state, action) => {
      state.contracts = action.payload.data;
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
  setContracts,
  setIsFetching,
  setIsSubmitting,
  setIsDeleting,
  setSuccessMessage,
  setErrorMessage,
  clearMessages,
} = contractSlice.actions;

export const contractReducer = contractSlice.reducer;

const selectContract = (state) => state.contract || initialState;

export const selectContractData = createSelector(
  [selectContract],
  (contract) => ({
    contracts: Array.isArray(contract.contracts)
      ? contract.contracts.map((c) => ({
          ContractID: c.ContractID || '',
          EmployeeID: c.EmployeeID || '',
          ContractType: c.ContractType || '',
          ProbationPeriod: c.ProbationPeriod ? Number(c.ProbationPeriod) : null,
          StartDate: c.StartDate ? new Date(c.StartDate).toISOString() : null,
          EndDate: c.EndDate ? new Date(c.EndDate).toISOString() : null,
          CreatedAt: c.CreatedAt ? new Date(c.CreatedAt).toISOString() : null,
          UpdatedAt: c.UpdatedAt ? new Date(c.UpdatedAt).toISOString() : null,
        }))
      : [],
    page: contract.page || 1,
    pageSize: contract.pageSize || 10,
    totalPages: contract.totalPages || 1,
    isFetching: contract.isFetching || false,
    isSubmitting: contract.isSubmitting || false,
    isDeleting: contract.isDeleting || false,
    successMessage: contract.successMessage || '',
    errorMessage: contract.errorMessage || '',
  })
);

export const useContractSlice = () => {
  const dispatch = useDispatch();
  const state = useSelector(selectContractData);
  const cancelTokenSource = useRef(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const contractAxios = axios.create({
    baseURL: baseUrl,
    timeout: 30000,
  });

  const fetchContracts = useCallback(async (page = 1, pageSize = 10) => {
    if (retryCount.current >= maxRetries) {
      dispatch(setErrorMessage(`Failed to fetch contracts after ${maxRetries} attempts.`));
      return;
    }

    dispatch(setIsFetching(true));
    dispatch(setErrorMessage(''));
    cancelTokenSource.current = CancelToken.source();

    try {
      const token = localStorage.getItem('token');
      console.log('fetchContracts - Token:', token || 'Missing');
      if (!token) {
        dispatch(setErrorMessage('Authentication required. Please log in.'));
        return;
      }

      const response = await contractAxios.get('', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, pageSize, includeEmployee: true },
        cancelToken: cancelTokenSource.current.token,
      });

      console.log('fetchContracts - Raw API response:', JSON.stringify(response.data, null, 2));
      const contracts = Array.isArray(response.data.Data) ? response.data.Data : [];
      const { totalRecords = 0, page: currentPage = 1, pageSize: responsePageSize = 10, totalPages = 1 } = response.data;

      const mappedContracts = contracts.map((c) => ({
        ContractID: c.ContractID || '',
        EmployeeID: c.EmployeeID || '',
        ContractType: c.ContractType || '',
        ProbationPeriod: c.ProbationPeriod ? Number(c.ProbationPeriod) : null,
        StartDate: c.StartDate ? new Date(c.StartDate).toISOString() : null,
        EndDate: c.EndDate ? new Date(c.EndDate).toISOString() : null,
        CreatedAt: c.CreatedAt ? new Date(c.CreatedAt).toISOString() : null,
        UpdatedAt: c.UpdatedAt ? new Date(c.UpdatedAt).toISOString() : null,
      }));

      dispatch(setContracts({
        data: mappedContracts,
        page: currentPage,
        pageSize: responsePageSize,
        totalPages,
      }));
      dispatch(setSuccessMessage('Contracts fetched successfully'));
      setTimeout(() => dispatch(setSuccessMessage('')), 5000);
      retryCount.current = 0; // Reset retry count on success
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('fetchContracts - Request cancelled');
        return;
      }
      const errorMsg = error.response
        ? `HTTP ${error.response.status}: ${error.response.data?.error || error.response.data?.title || error.response.statusText || 'Unknown error'}`
        : error.message;
      dispatch(setErrorMessage(errorMsg));
      retryCount.current += 1;
      setTimeout(() => fetchContracts(page, pageSize), 2000 * Math.pow(2, retryCount.current));
    } finally {
      dispatch(setIsFetching(false));
    }
  }, [dispatch]);

  const handleSubmit = useCallback(async (payload, isEditMode) => {
    if (!payload || !payload.EmployeeID || !payload.ContractType || !payload.StartDate) {
      dispatch(setErrorMessage('Invalid payload: EmployeeID, ContractType, and StartDate are required'));
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

      const isEdit = isEditMode && payload.ContractID?.trim();
      const url = isEdit ? `/${payload.ContractID}` : '';

      const response = await contractAxios({
        method: isEdit ? 'PUT' : 'POST',
        url,
        data: {
          EmployeeID: payload.EmployeeID,
          ContractType: payload.ContractType,
          ProbationPeriod: payload.ProbationPeriod ? parseInt(payload.ProbationPeriod) : null,
          StartDate: payload.StartDate || null,
          EndDate: payload.EndDate || null,
        },
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        cancelToken: cancelTokenSource.current.token,
      });

      await fetchContracts(state.page, state.pageSize);
      dispatch(setSuccessMessage(isEdit ? 'Contract updated' : 'Contract added'));
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
  }, [dispatch, fetchContracts, state.page, state.pageSize]);

  const handleDelete = useCallback(async (contractId) => {
    if (!contractId) {
      dispatch(setErrorMessage('Invalid contract ID'));
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

      await contractAxios.delete(`/${contractId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cancelToken: cancelTokenSource.current.token,
      });

      await fetchContracts(state.page, state.pageSize);
      dispatch(setSuccessMessage('Contract deleted successfully'));
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
  }, [dispatch, fetchContracts, state.page, state.pageSize]);

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
    fetchContracts,
    handleSubmit,
    handleDelete,
    clearMessages: () => dispatch(clearMessages()),
  };
};