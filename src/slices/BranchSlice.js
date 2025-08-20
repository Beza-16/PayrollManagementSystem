import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const useBranchSlice = (baseUrl = 'https://localhost:14686/api/Branch') => {
  const [branches, setBranches] = useState([]);
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
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });

  const fetchBranches = useCallback(async () => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage('Failed to fetch branches after multiple attempts.');
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    try {
      const response = await axiosInstance.get('');
      const mappedBranches = response.data.map(branch => ({
        BranchID: branch.BranchID,
        CompanyID: branch.CompanyID,
        CompanyName: branch.CompanyName || 'N/A',
        BranchName: branch.BranchName,
        PhoneNumber: branch.PhoneNumber,
        Email: branch.Email,
        LocationID: branch.LocationID,
        city: branch.City,
        country: branch.Country,
        state_or_region: branch.State,
        street: branch.Street,
        latitude: branch.Latitude,
        longitude: branch.Longitude,
        created_at: branch.CreatedAt,
        updatedAt: branch.UpdatedAt,
      }));
      setBranches(mappedBranches || []);
      retryCount.current = 0;
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to fetch branches: ${error.response.status} - ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
        : `Failed to fetch branches: ${error.message}`;
      console.error('Fetch error details:', errorMsg);
      setErrorMessage(errorMsg);
      retryCount.current += 1;
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    const debounceFetch = setTimeout(() => fetchBranches(), 100);
    return () => clearTimeout(debounceFetch);
  }, [fetchBranches]);

  const handleSubmit = async (payload, branchId = null) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const isEdit = !!branchId;
      const formattedPayload = {
        BranchName: payload.BranchName || '',
        CompanyID: payload.CompanyID,
        PhoneNumber: payload.PhoneNumber || null,
        Email: payload.Email || null,
        LocationID: payload.LocationID,
      };

      if (!formattedPayload.LocationID) {
        throw new Error('Missing LocationID in payload');
      }

      const cleanedPayload = Object.fromEntries(
        Object.entries(formattedPayload).filter(([_, value]) => value !== undefined && value !== '')
      );

      const response = await axiosInstance[isEdit ? 'put' : 'post'](
        isEdit ? `/${branchId}` : '',
        cleanedPayload
      );

      if (response.status === 201 || response.status === 200) {
        setSuccessMessage(isEdit ? 'Updated successfully' : 'Submitted successfully');
        await fetchBranches();
        const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
        timeoutIds.current.push(successTimeout);
        return response.data;
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      let errorMsg = error.response
        ? `Failed to ${branchId ? 'update' : 'add'} branch: ${error.response.status} - ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
        : `Failed to ${branchId ? 'update' : 'add'} branch: ${error.message}`;
      console.error('Submit error details:', errorMsg);
      setErrorMessage(errorMsg);
      const errorTimeout = setTimeout(() => setErrorMessage(''), 10000);
      timeoutIds.current.push(errorTimeout);
      throw error;
    } finally {
      setIsSubmitting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  const handleDelete = async (branchId) => {
    if (!branchId || branchId === 'undefined') {
      setErrorMessage('Cannot delete branch: Invalid branch ID');
      return;
    }

    setIsDeleting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      await axiosInstance.delete(`/${branchId}`);
      setSuccessMessage('Deleted successfully');
      await fetchBranches();
      const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
      timeoutIds.current.push(successTimeout);
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to delete branch: ${error.response.status} - ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
        : `Failed to delete branch: ${error.message}`;
      console.error('Delete error details:', errorMsg);
      setErrorMessage(errorMsg);
      const errorTimeout = setTimeout(() => setErrorMessage(''), 10000);
      timeoutIds.current.push(errorTimeout);
    } finally {
      setIsDeleting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  return {
    branches,
    successMessage,
    errorMessage,
    isFetching,
    isSubmitting,
    isDeleting,
    fetchBranches,
    handleSubmit,
    handleDelete,
  };
};

export { useBranchSlice };