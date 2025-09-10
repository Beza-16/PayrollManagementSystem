// import { useState, useEffect, useCallback, useRef } from 'react';
// import axios from 'axios';
// import { v4 as uuidv4 } from 'uuid';

// const useLeaveTypeSlice = (leaveTypeBaseUrl = process.env.REACT_APP_API_URL || 'https://localhost:14686/api/LeaveType') => {
//   const [leaveTypes, setLeaveTypes] = useState([]);
//   const [successMessage, setSuccessMessage] = useState('');
//   const [errorMessage, setErrorMessage] = useState('');
//   const [isFetching, setIsFetching] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);

//   const timeoutIds = useRef([]);
//   const retryCount = useRef(0);
//   const maxRetries = 5;

//   const leaveTypeAxios = axios.create({
//     baseURL: leaveTypeBaseUrl,
//     headers: { 'Content-Type': 'application/json' },
//     timeout: 10000,
//   });

//   const fetchLeaveTypes = useCallback(async () => {
//     if (retryCount.current >= maxRetries) {
//       setErrorMessage('Failed to fetch leave types after multiple attempts.');
//       return;
//     }

//     setIsFetching(true);
//     setErrorMessage('');
//     try {
//       const token = localStorage.getItem('token');
//       console.log(`Fetching leave types from: ${leaveTypeBaseUrl}`);
//       const response = await leaveTypeAxios.get('', {
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       console.log('Raw API response for leave types:', JSON.stringify(response.data, null, 2));
//       setLeaveTypes(response.data.map(lt => ({
//         LeaveTypeID: lt.LeaveTypeID,
//         Name: lt.Name || 'N/A',
//         Description: lt.Description || 'N/A',
//         LeaveWithPay: lt.LeaveWithPay || false,
//         MedicalApproval: lt.MedicalApproval || false,
//         HRApprovalRequired: lt.HRApprovalRequired || false,
//         CreatedAt: lt.CreatedAt,
//         UpdatedAt: lt.UpdatedAt
//       })) || []);
//       retryCount.current = 0;
//     } catch (error) {
//       console.error('Fetch error details:', {
//         message: error.message,
//         response: error.response ? {
//           status: error.response.status,
//           statusText: error.response.statusText,
//           data: error.response.data
//         } : null,
//         config: error.config
//       });
//       const errorMsg = error.response
//         ? `Failed to fetch leave types: ${error.response.status} - ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
//         : `Failed to fetch leave types: ${error.message}`;
//       setErrorMessage(errorMsg);
//       retryCount.current += 1;
//     } finally {
//       setIsFetching(false);
//     }
//   }, [leaveTypeBaseUrl]);

//   useEffect(() => {
//     const debounceFetch = setTimeout(() => fetchLeaveTypes(), 100);
//     return () => clearTimeout(debounceFetch);
//   }, [fetchLeaveTypes]);

//   const handleSubmit = async (leaveTypeData) => {
//     setIsSubmitting(true);
//     setErrorMessage('');
//     const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
//     timeoutIds.current.push(timeoutId);

//     try {
//       const token = localStorage.getItem('token');
//       const isEdit = leaveTypeData.LeaveTypeID && leaveTypeData.LeaveTypeID.trim() !== '';
//       const payload = {
//         LeaveTypeID: isEdit ? leaveTypeData.LeaveTypeID : uuidv4(),
//         Name: leaveTypeData.Name,
//         Description: leaveTypeData.Description,
//         LeaveWithPay: leaveTypeData.LeaveWithPay,
//         MedicalApproval: leaveTypeData.MedicalApproval,
//         HRApprovalRequired: leaveTypeData.HRApprovalRequired,
//       };
//       console.log(`Submitting to ${leaveTypeBaseUrl}`, payload);
//       const response = await leaveTypeAxios[isEdit ? 'put' : 'post'](
//         isEdit ? `/${leaveTypeData.LeaveTypeID}` : '',
//         payload,
//         { headers: { 'Authorization': `Bearer ${token}` } }
//       );

//       setSuccessMessage(isEdit ? 'Updated successfully' : 'Submitted successfully');
//       await fetchLeaveTypes();
//       const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
//       timeoutIds.current.push(successTimeout);
//       return response.data;
//     } catch (error) {
//       console.error('Submit error details:', {
//         message: error.message,
//         response: error.response ? {
//           status: error.response.status,
//           statusText: error.response.statusText,
//           data: error.response.data
//         } : null,
//         config: error.config
//       });
//       let errorMsg = error.response
//         ? `Failed to ${leaveTypeData.LeaveTypeID ? 'update' : 'add'} leave type: ${error.response.status} - ${error.response.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : error.response.statusText}`
//         : `Failed to ${leaveTypeData.LeaveTypeID ? 'update' : 'add'} leave type: ${error.message}`;
//       setErrorMessage(errorMsg);
//       const errorTimeout = setTimeout(() => setErrorMessage(''), 10000);
//       timeoutIds.current.push(errorTimeout);
//       throw error;
//     } finally {
//       setIsSubmitting(false);
//       clearTimeout(timeoutId);
//       timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
//     }
//   };

//   const handleDelete = async (leaveTypeId) => {
//     if (!leaveTypeId || leaveTypeId === 'undefined') {
//       setErrorMessage('Cannot delete leave type: Invalid leave type ID');
//       return;
//     }

//     setIsDeleting(true);
//     setErrorMessage('');
//     const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
//     timeoutIds.current.push(timeoutId);

//     try {
//       const token = localStorage.getItem('token');
//       console.log(`Deleting from ${leaveTypeBaseUrl}/${leaveTypeId}`);
//       await leaveTypeAxios.delete(`/${leaveTypeId}`, {
//         headers: { 'Authorization': `Bearer ${token}` },
//       });
//       setSuccessMessage('Deleted successfully');
//       await fetchLeaveTypes();
//       const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
//       timeoutIds.current.push(successTimeout);
//     } catch (error) {
//       console.error('Delete error details:', {
//         message: error.message,
//         response: error.response ? {
//           status: error.response.status,
//           statusText: error.response.statusText,
//           data: error.response.data
//         } : null,
//         config: error.config
//       });
//       const errorMsg = error.response
//         ? `Failed to delete leave type: ${error.response.status} - ${error.response.statusText}`
//         : `Failed to delete leave type: ${error.message}`;
//       setErrorMessage(errorMsg);
//       const errorTimeout = setTimeout(() => setErrorMessage(''), 10000);
//       timeoutIds.current.push(errorTimeout);
//     } finally {
//       setIsDeleting(false);
//       clearTimeout(timeoutId);
//       timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
//     }
//   };

//   return {
//     leaveTypes,
//     successMessage,
//     errorMessage,
//     isFetching,
//     isSubmitting,
//     isDeleting,
//     fetchLeaveTypes,
//     handleSubmit,
//     handleDelete,
//   };
// };

// export { useLeaveTypeSlice };

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const useLeaveTypeSlice = (leaveTypeBaseUrl = process.env.REACT_APP_API_URL || 'https://localhost:14686/api/LeaveType') => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const timeoutIds = useRef([]);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const retryDelay = 1000;

  const leaveTypeAxios = axios.create({
    baseURL: leaveTypeBaseUrl,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });

  const fetchLeaveTypes = useCallback(async (attempt = 1) => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage('Failed to fetch leave types after multiple attempts.');
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      console.log(`Fetching leave types from: ${leaveTypeBaseUrl}`);
      const response = await leaveTypeAxios.get('', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      console.log('Raw API response for leave types:', JSON.stringify(response.data, null, 2));
      setLeaveTypes(response.data.map(lt => ({
        LeaveTypeID: lt.LeaveTypeID,
        Name: lt.Name || 'N/A',
        Description: lt.Description || 'N/A',
        LeaveWithPay: lt.LeaveWithPay ?? false,
        MedicalApproval: lt.MedicalApproval ?? false,
        HRApprovalRequired: lt.HRApprovalRequired ?? false,
        CreatedAt: lt.CreatedAt,
        UpdatedAt: lt.UpdatedAt
      })) || []);
      retryCount.current = 0;
    } catch (error) {
      console.error('Fetch error details:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null,
        config: error.config
      });
      const errorMsg = error.response
        ? `Failed to fetch leave types: ${error.response.status} - ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
        : `Failed to fetch leave types: ${error.message}`;
      if (attempt <= maxRetries) {
        setTimeout(() => fetchLeaveTypes(attempt + 1), retryDelay * attempt);
        retryCount.current += 1;
      } else {
        setErrorMessage(errorMsg);
        retryCount.current = 0;
      }
    } finally {
      setIsFetching(false);
    }
  }, [leaveTypeBaseUrl]);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  const handleSubmit = async (leaveTypeData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const token = localStorage.getItem('token');
      const isEdit = leaveTypeData.LeaveTypeID && leaveTypeData.LeaveTypeID.trim() !== '';
      const payload = {
        LeaveTypeID: isEdit ? leaveTypeData.LeaveTypeID : uuidv4(),
        Name: leaveTypeData.Name,
        Description: leaveTypeData.Description,
        LeaveWithPay: leaveTypeData.LeaveWithPay ?? false,
        MedicalApproval: leaveTypeData.MedicalApproval ?? false,
        HRApprovalRequired: leaveTypeData.HRApprovalRequired ?? false,
      };
      console.log(`Submitting to ${leaveTypeBaseUrl}`, payload);
      const response = await leaveTypeAxios[isEdit ? 'put' : 'post'](
        isEdit ? `/${leaveTypeData.LeaveTypeID}` : '',
        payload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setSuccessMessage(isEdit ? 'Updated successfully' : 'Submitted successfully');
      await fetchLeaveTypes();
      const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
      timeoutIds.current.push(successTimeout);
      return response.data;
    } catch (error) {
      console.error('Submit error details:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null,
        config: error.config
      });
      let errorMsg = error.response
        ? `Failed to ${leaveTypeData.LeaveTypeID ? 'update' : 'add'} leave type: ${error.response.status} - ${error.response.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : error.response.statusText}`
        : `Failed to ${leaveTypeData.LeaveTypeID ? 'update' : 'add'} leave type: ${error.message}`;
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

  const handleDelete = async (leaveTypeId) => {
    if (!leaveTypeId || leaveTypeId === 'undefined') {
      setErrorMessage('Cannot delete leave type: Invalid leave type ID');
      return;
    }

    setIsDeleting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const token = localStorage.getItem('token');
      console.log(`Deleting from ${leaveTypeBaseUrl}/${leaveTypeId}`);
      await leaveTypeAxios.delete(`/${leaveTypeId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setSuccessMessage('Deleted successfully');
      await fetchLeaveTypes();
      const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
      timeoutIds.current.push(successTimeout);
    } catch (error) {
      console.error('Delete error details:', {
        message: error.message,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null,
        config: error.config
      });
      const errorMsg = error.response
        ? `Failed to delete leave type: ${error.response.status} - ${error.response.statusText}`
        : `Failed to delete leave type: ${error.message}`;
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
    leaveTypes,
    successMessage,
    errorMessage,
    isFetching,
    isSubmitting,
    isDeleting,
    fetchLeaveTypes,
    handleSubmit,
    handleDelete,
  };
};

export { useLeaveTypeSlice };