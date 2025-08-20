import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const useCompanySlice = (baseUrl = 'https://localhost:14686/api/Company') => {
  const [companies, setCompanies] = useState([]);
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

  const fetchCompanies = useCallback(async () => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage('Failed to fetch companies after multiple attempts.');
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    try {
      const response = await axiosInstance.get('');
      console.log('Raw API response:', JSON.stringify(response.data, null, 2));
      const mappedCompanies = response.data.map(company => ({
        CompanyID: company.CompanyID,
        CompanyName: company.CompanyName,
        PhoneNumber: company.PhoneNumber,
        Email: company.Email,
        location_id: company.LocationID, // Changed to lowercase to match backend
        city: company.City,
        country: company.Country,
        state_or_region: company.State,
        street: company.Street,
        latitude: company.Latitude,
        longitude: company.Longitude,
        created_at: company.CreatedAt,
        updatedAt: company.UpdatedAt,
      }));
      setCompanies(mappedCompanies || []);
      retryCount.current = 0;
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to fetch companies: ${error.response.status} - ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
        : `Failed to fetch companies: ${error.message}`;
      console.error('Fetch error details:', errorMsg);
      setErrorMessage(errorMsg);
      retryCount.current += 1;
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    const debounceFetch = setTimeout(() => fetchCompanies(), 100);
    return () => clearTimeout(debounceFetch);
  }, [fetchCompanies]);

  const handleSubmit = async (payload, companyId = null) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const isEdit = !!companyId;
      const formattedPayload = {
        CompanyName: payload.CompanyName || '',
        PhoneNumber: payload.PhoneNumber || null,
        Email: payload.Email || null,
        location_id: payload.location_id, // Changed to lowercase to match backend
      };

      if (!formattedPayload.location_id) {
        throw new Error('Missing location_id in payload');
      }

      const cleanedPayload = Object.fromEntries(
        Object.entries(formattedPayload).filter(([_, value]) => value !== undefined && value !== '')
      );

      const payloadString = JSON.stringify(cleanedPayload);
      console.log('Cleaned payload being sent:', payloadString);

      const response = await axiosInstance[isEdit ? 'put' : 'post'](
        isEdit ? `/${companyId}` : '',
        cleanedPayload
      );

      if (response.status === 201 || response.status === 200) {
        setSuccessMessage(isEdit ? 'Updated successfully' : 'Submitted successfully');
        await fetchCompanies();
        const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
        timeoutIds.current.push(successTimeout);
        return response.data;
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      let errorMsg = error.response
        ? `Failed to ${companyId ? 'update' : 'add'} company: ${error.response.status} - ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
        : `Failed to ${companyId ? 'update' : 'add'} company: ${error.message}`;
      console.error('Submit error details:', errorMsg, error.stack);
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

  const handleDelete = async (companyId) => {
    if (!companyId || companyId === 'undefined') {
      setErrorMessage('Cannot delete company: Invalid company ID');
      return;
    }

    setIsDeleting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const response = await axiosInstance.delete(`/${companyId}`);
      setSuccessMessage('Deleted successfully');
      await fetchCompanies();
      const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
      timeoutIds.current.push(successTimeout);
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to delete company: ${error.response.status} - ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
        : `Failed to delete company: ${error.message}`;
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
    companies,
    successMessage,
    errorMessage,
    isFetching,
    isSubmitting,
    isDeleting,
    fetchCompanies,
    handleSubmit,
    handleDelete,
  };
};

export { useCompanySlice };