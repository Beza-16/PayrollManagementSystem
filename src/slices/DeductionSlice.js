import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const useDeductionSlice = (baseUrl = 'https://localhost:14686/api/Deduction') => {
  const [deductions, setDeductions] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const timeoutIds = useRef([]);
  const retryCount = useRef(0);
  const maxRetries = 5;

  const axiosInstance = axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    timeout: 10000,
  });

  const fetchDeductions = useCallback(async () => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage('Failed to fetch deductions after multiple attempts.');
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    try {
      const response = await axiosInstance.get('');
      console.log('Raw API Response:', response.data);
      const mappedDeductions = response.data.map((deduction) => {
        const validStatuses = ['Draft', 'Pending Approval', 'Approved', 'Applied', 'Cancelled'];
        if (!validStatuses.includes(deduction.Status)) {
          console.warn(`Unexpected Status for DeductionID ${deduction.DeductionID}: ${deduction.Status}`);
        }
        if (deduction.Amount === null || deduction.Amount === undefined) {
          console.warn(`Missing Amount for DeductionID ${deduction.DeductionID}`);
        }
        return {
          DeductionID: deduction.DeductionID,
          EmployeeID: deduction.EmployeeID,
          PeriodID: deduction.PeriodID,
          DeductionTypeID: deduction.DeductionTypeID,
          EmployeeName: deduction.EmployeeName || 'N/A',
          PeriodName: deduction.PeriodName || 'N/A',
          DeductionTypeName: deduction.DeductionTypeName || 'N/A',
          Amount: deduction.Amount ?? 0,
          IsFixedAmount: deduction.IsFixedAmount ?? true,
          CalculationRule: deduction.CalculationRule || 'N/A',
          StartDate: deduction.StartDate,
          EndDate: deduction.EndDate,
          Status: validStatuses.includes(deduction.Status) ? deduction.Status : 'Draft',
          Remarks: deduction.Remarks || 'N/A',
          CreatedAt: deduction.CreatedAt,
          UpdatedAt: deduction.UpdatedAt,
        };
      });
      setDeductions(mappedDeductions);
      retryCount.current = 0;
    } catch (error) {
      setErrorMessage(`Failed to fetch deductions: ${error.message}`);
      retryCount.current += 1;
      console.error('Fetch error:', error);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchDeductions();
  }, [fetchDeductions]);

  const handleSubmit = async (payload, deductionId = null) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const isEdit = !!deductionId;
      const response = await axiosInstance[isEdit ? 'put' : 'post'](
        isEdit ? `/${deductionId}` : '',
        payload
      );
      if (response.status === 201 || response.status === 200) {
        setSuccessMessage(isEdit ? 'Updated successfully' : 'Submitted successfully');
        await fetchDeductions();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error || `Failed to ${deductionId ? 'update' : 'add'} deduction: ${error.message}`
      );
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  const handleDelete = async (deductionId) => {
    setIsDeleting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      await axiosInstance.delete(`/${deductionId}`);
      setSuccessMessage('Deleted successfully');
      await fetchDeductions();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      setErrorMessage(error.response?.data?.error || `Failed to delete deduction: ${error.message}`);
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  const calculatePayroll = async (employeeId, periodId) => {
    try {
      const response = await axiosInstance.get(`/payroll/${employeeId}/${periodId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error calculating payroll');
    }
  };

  return {
    deductions,
    successMessage,
    errorMessage,
    setErrorMessage,
    isFetching,
    isSubmitting,
    isDeleting,
    fetchDeductions,
    handleSubmit,
    handleDelete,
    calculatePayroll,
  };
};

export { useDeductionSlice };