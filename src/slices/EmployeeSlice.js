import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { CancelToken } from 'axios';

const useEmployeeSlice = (employeeBaseUrl = 'https://localhost:14686/api/Employee') => {
  const [employees, setEmployees] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelTokenSource = useRef(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const employeeAxios = axios.create({
    baseURL: employeeBaseUrl,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
    timeout: 30000,
  });

  const fetchEmployees = useCallback(async () => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage(`Failed to fetch after ${maxRetries} attempts.`);
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    cancelTokenSource.current = CancelToken.source();

    try {
      const response = await employeeAxios.get('', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        cancelToken: cancelTokenSource.current.token,
      });
      const mappedEmployees = response.data.map((employee) => ({
        ...employee,
        City: employee.City || 'N/A',
        Country: employee.Country || 'N/A',
        location_id: employee.EmployeeID || '',
      }));
      setEmployees(mappedEmployees || []);
      retryCount.current = 0;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Fetch employees cancelled');
        return;
      }
      const errorMsg = error.response
        ? `HTTP ${error.response.status}: ${error.response.data?.error || error.response.data?.title || error.response.statusText}`
        : error.message;
      setErrorMessage(errorMsg);
      retryCount.current += 1;
      setTimeout(fetchEmployees, 2000 * Math.pow(2, retryCount.current));
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    return () => {
      if (cancelTokenSource.current) {
        cancelTokenSource.current.cancel('Component unmounted');
      }
    };
  }, [fetchEmployees]);

  const handleSubmit = async (employeeData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    cancelTokenSource.current = CancelToken.source();

    try {
      const isEdit = employeeData.EmployeeID && employeeData.EmployeeID.trim() !== '';
      const response = await employeeAxios[isEdit ? 'put' : 'post'](
        isEdit ? `/${employeeData.EmployeeID}` : '',
        employeeData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
          cancelToken: cancelTokenSource.current.token,
        }
      );
      setSuccessMessage(isEdit ? 'Updated successfully' : 'Added successfully');
      await fetchEmployees();
      setTimeout(() => setSuccessMessage(''), 5000);
      return response.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Submit employee cancelled');
        return;
      }
      const errorMsg = error.response
        ? `HTTP ${error.response.status}: ${error.response.data?.error || error.response.data?.title || error.message}`
        : error.message;
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
      throw error; // Rethrow to let EmployeeForm.js handle field-specific errors
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (employeeId) => {
    if (!employeeId) {
      setErrorMessage('Invalid employee ID');
      return;
    }

    setIsDeleting(true);
    setErrorMessage('');
    cancelTokenSource.current = CancelToken.source();

    try {
      await employeeAxios.delete(`/${employeeId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        cancelToken: cancelTokenSource.current.token,
      });
      setSuccessMessage('Deleted successfully');
      await fetchEmployees();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Delete employee cancelled');
        return;
      }
      setErrorMessage(`Failed to delete: ${error.response?.data?.error || error.message}`);
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    employees,
    successMessage,
    errorMessage,
    isFetching,
    isSubmitting,
    isDeleting,
    fetchEmployees,
    handleSubmit,
    handleDelete,
  };
};

export { useEmployeeSlice };