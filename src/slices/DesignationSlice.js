import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const useDesignationSlice = (baseUrl = 'https://localhost:14686/api/Designation') => {
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const timeoutIds = useRef([]);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const axiosInstance = axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('jwtToken') || ''}`,
    },
    timeout: 10000,
  });

  const fetchDesignations = useCallback(async () => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage('Failed to fetch designations after multiple attempts.');
      return;
    }
    setIsFetching(true);
    setErrorMessage('');
    try {
      const response = await axiosInstance.get('');
      console.log('Fetched designations:', response.data);
      setDesignations(response.data || []);
      retryCount.current = 0;
    } catch (error) {
      const errorMsg = error.response
        ? (error.response.status === 401 ? 'Unauthorized: Please log in again.' : `Failed to fetch designations: ${error.response.status} - ${error.response.statusText}`)
        : `Failed to fetch designations: ${error.message}`;
      console.error('Error fetching designations:', errorMsg, error.response?.data);
      setErrorMessage(errorMsg);
      retryCount.current += 1;
      if (retryCount.current < maxRetries) setTimeout(fetchDesignations, 1000);
    } finally {
      setIsFetching(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    setIsFetching(true);
    setErrorMessage('');
    try {
      const response = await axios.create({
        baseURL: 'https://localhost:14686/api/Department',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('jwtToken') || ''}` },
        timeout: 10000,
      }).get('');
      console.log('Fetched departments:', response.data);
      setDepartments(response.data || []);
      return response.data || [];
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to fetch departments: ${error.response.status} - ${error.response.statusText}`
        : `Failed to fetch departments: ${error.message}`;
      console.error('Error fetching departments:', errorMsg, error.response?.data);
      setErrorMessage(errorMsg);
      return [];
    } finally {
      setIsFetching(false);
    }
  }, []);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const isEdit = payload.designationID && payload.designationID !== '';
      const formattedPayload = {
        DepartmentID: payload.departmentID,
        DesignationName: payload.designationName || '',
        Status: payload.status === 'Active' ? 1 : 0,
      };

      console.log('Final payload:', JSON.stringify(formattedPayload));
      if (!formattedPayload.DepartmentID || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(formattedPayload.DepartmentID)) {
        throw new Error('Invalid DepartmentID: Must be a valid GUID');
      }
      if (!formattedPayload.DesignationName || formattedPayload.DesignationName.length > 50 || formattedPayload.DesignationName.length < 1) {
        throw new Error('DesignationName must be between 1 and 50 characters');
      }
      if (formattedPayload.Status === undefined) {
        throw new Error('Status is required');
      }

      const response = await axiosInstance[isEdit ? 'put' : 'post'](
        isEdit ? `/${payload.designationID}` : '',
        formattedPayload
      );

      // Accept 200 for updates, 201 for creation, 204 for no content
      if (response.status === 200 || response.status === 201 || response.status === 204) {
        setSuccessMessage(isEdit ? 'Designation updated successfully' : 'Designation added successfully');
        await fetchDesignations(); // Refresh the list
        const successTimeout = setTimeout(() => setSuccessMessage(''), 5000);
        timeoutIds.current.push(successTimeout);
        return response.data;
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      let errorMsg = error.response
        ? `Failed to ${payload.designationID ? 'update' : 'add'} designation: ${error.response.status} - ${error.response.data?.error || error.response.data?.details || error.response.statusText}`
        : `Failed to ${payload.designationID ? 'update' : 'add'} designation: ${error.message}`;
      console.error('Error response:', error.response?.data || error.message, error.config);
      setErrorMessage(errorMsg);
      const errorTimeout = setTimeout(() => setErrorMessage(''), 5000);
      timeoutIds.current.push(errorTimeout);
      throw error;
    } finally {
      setIsSubmitting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter(id => id !== timeoutId);
    }
  };

  const handleDelete = async (designationID) => {
    if (!designationID || designationID === 'undefined') {
      setErrorMessage('Cannot delete designation: Invalid designation ID');
      return;
    }
    setIsDeleting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const response = await axiosInstance.delete(`/${designationID}`);
      if (response.status === 204) {
        setSuccessMessage('Designation deleted successfully');
        await fetchDesignations(); // Refresh the list
        const successTimeout = setTimeout(() => setSuccessMessage(''), 5000);
        timeoutIds.current.push(successTimeout);
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to delete designation: ${error.response.status} - ${error.response.statusText}`
        : `Failed to delete designation: ${error.message}`;
      setErrorMessage(errorMsg);
      const errorTimeout = setTimeout(() => setErrorMessage(''), 5000);
      timeoutIds.current.push(errorTimeout);
    } finally {
      setIsDeleting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter(id => id !== timeoutId);
    }
  };

  useEffect(() => {
    const debounceFetch = setTimeout(() => {
      fetchDesignations();
      fetchDepartments();
    }, 300);
    return () => clearTimeout(debounceFetch);
  }, [fetchDesignations, fetchDepartments]);

  return {
    designations,
    departments,
    successMessage,
    errorMessage,
    isFetching,
    isSubmitting,
    isDeleting,
    fetchDesignations,
    handleSubmit,
    handleDelete,
    fetchDepartments,
  };
};

export { useDesignationSlice };