import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const useDepartmentSlice = (baseUrl = 'https://localhost:14686/api/Department') => {
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [companies, setCompanies] = useState([]);
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

  const fetchDepartments = useCallback(async () => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage('Failed to fetch departments after multiple attempts.');
      return;
    }
    setIsFetching(true);
    setErrorMessage('');
    try {
      const response = await axiosInstance.get('');
      console.log('Fetched departments:', response.data);
      setDepartments(response.data || []);
      retryCount.current = 0;
    } catch (error) {
      const errorMsg = error.response
        ? (error.response.status === 401 ? 'Unauthorized: Please log in again.' : `Failed to fetch departments: ${error.response.status} - ${error.response.statusText}`)
        : `Failed to fetch departments: ${error.message}`;
      console.error('Error fetching departments:', errorMsg, error.response?.data);
      setErrorMessage(errorMsg);
      retryCount.current += 1;
      if (retryCount.current < maxRetries) setTimeout(fetchDepartments, 1000);
    } finally {
      setIsFetching(false);
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    setIsFetching(true);
    setErrorMessage('');
    try {
      const response = await axios.create({
        baseURL: 'https://localhost:14686/api/Company',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('jwtToken') || ''}` },
        timeout: 10000,
      }).get('');
      console.log('Fetched companies:', response.data);
      setCompanies(response.data || []);
      return response.data || [];
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to fetch companies: ${error.response.status} - ${error.response.statusText}`
        : `Failed to fetch companies: ${error.message}`;
      console.error('Error fetching companies:', errorMsg, error.response?.data);
      setErrorMessage(errorMsg);
      return [];
    } finally {
      setIsFetching(false);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    setIsFetching(true);
    setErrorMessage('');
    try {
      const response = await axios.create({
        baseURL: 'https://localhost:14686/api/Branch',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('jwtToken') || ''}` },
        timeout: 10000,
      }).get('');
      console.log('Fetched branches raw response:', JSON.stringify(response.data, null, 2));
      if (!Array.isArray(response.data)) {
        console.error('Expected an array from Branch API, got:', JSON.stringify(response.data, null, 2));
        setBranches([]);
        return [];
      }
      const mappedBranches = response.data.map(branch => {
        console.log('Mapping branch:', branch);
        if (!branch.BranchID) {
          console.warn('Invalid branch data detected: Missing BranchID', branch);
          return null;
        }
        return {
          BranchID: branch.BranchID,
          BranchName: branch.BranchName || 'Unnamed Branch',
          CompanyID: branch.CompanyID || null
        };
      }).filter(branch => branch !== null);
      console.log('Mapped branches for dropdown:', JSON.stringify(mappedBranches, null, 2));
      setBranches(mappedBranches);
      return mappedBranches;
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to fetch branches: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`
        : `Failed to fetch branches: ${error.message}`;
      console.error('Error fetching branches:', errorMsg, error.response?.data, error.config?.url);
      setErrorMessage(errorMsg);
      setBranches([]);
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
      const isEdit = payload.departmentID && payload.departmentID !== '';
      const formattedPayload = {
        CompanyID: payload.companyID,
        BranchID: payload.branchID || null,
        DepartmentName: payload.departmentName || '',
        Status: payload.status === 'Active' ? 1 : 0,
      };

      console.log('Final payload:', JSON.stringify(formattedPayload));
      if (!formattedPayload.CompanyID || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(formattedPayload.CompanyID)) {
        throw new Error('Invalid CompanyID: Must be a valid GUID');
      }
      if (formattedPayload.BranchID && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(formattedPayload.BranchID)) {
        throw new Error('Invalid BranchID: Must be a valid GUID or null');
      }
      if (!formattedPayload.DepartmentName || formattedPayload.DepartmentName.length > 50 || formattedPayload.DepartmentName.length < 1) {
        throw new Error('DepartmentName must be between 1 and 50 characters');
      }
      if (formattedPayload.Status === undefined) {
        throw new Error('Status is required');
      }

      const response = await axiosInstance[isEdit ? 'put' : 'post'](
        isEdit ? `/${payload.departmentID}` : '',
        formattedPayload
      );

      if (response.status === 201 || response.status === 204) {
        setSuccessMessage(isEdit ? 'Department updated successfully' : 'Department added successfully');
        await fetchDepartments(); // Ensure departments are refreshed
        const successTimeout = setTimeout(() => setSuccessMessage(''), 5000);
        timeoutIds.current.push(successTimeout);
        return response.data;
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      let errorMsg = error.response
        ? `Failed to ${payload.departmentID ? 'update' : 'add'} department: ${error.response.status} - ${error.response.data?.error || error.response.data?.details || error.response.statusText}`
        : `Failed to ${payload.departmentID ? 'update' : 'add'} department: ${error.message}`;
      console.error('Error response:', error.response?.data);
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

  const handleDelete = async (departmentID) => {
    if (!departmentID || departmentID === 'undefined') {
      setErrorMessage('Cannot delete department: Invalid department ID');
      return;
    }
    setIsDeleting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const response = await axiosInstance.delete(`/${departmentID}`);
      if (response.status === 204) {
        setSuccessMessage('Department deleted successfully');
        await fetchDepartments(); // Ensure departments are refreshed
        const successTimeout = setTimeout(() => setSuccessMessage(''), 5000);
        timeoutIds.current.push(successTimeout);
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to delete department: ${error.response.status} - ${error.response.statusText}`
        : `Failed to delete department: ${error.message}`;
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
      fetchDepartments();
      fetchCompanies();
      fetchBranches();
    }, 300);
    return () => clearTimeout(debounceFetch);
  }, [fetchDepartments, fetchCompanies, fetchBranches]);

  return {
    departments,
    branches,
    companies,
    successMessage,
    errorMessage,
    isFetching,
    isSubmitting,
    isDeleting,
    fetchDepartments,
    handleSubmit,
    handleDelete,
    fetchCompanies,
    fetchBranches,
  };
};

export { useDepartmentSlice };