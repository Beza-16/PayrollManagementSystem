import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from './authSlice';
import { useNavigate } from 'react-router-dom';

const useCalendarDetailSlice = (baseUrl = 'https://localhost:14686/api/Calendar') => {
  const [calendarDetails, setCalendarDetails] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [calendarExists, setCalendarExists] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const axiosInstance = useRef(
    axios.create({
      baseURL: baseUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    })
  ).current;

  useEffect(() => {
    const interceptor = axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      config.headers.Authorization = token ? `Bearer ${token}` : '';
      return config;
    });
    return () => axiosInstance.interceptors.request.eject(interceptor);
  }, [axiosInstance]);

  const checkCalendarExists = useCallback(async (periodId) => {
    if (!periodId || periodId === '00000000-0000-0000-0000-000000000000') return false;

    if (!isAuthenticated) {
      setErrorMessage('Please log in to continue.');
      setNeedsLogin(true);
      return false;
    }

    setIsFetching(true);
    setErrorMessage('');
    try {
      const response = await axiosInstance.get(`?periodId=${periodId}`);
      setCalendarExists(response.data.length > 0);
      setCalendarDetails(response.data);
      return response.data.length > 0;
    } catch (error) {
      const status = error.response?.status;
      if (status === 400 || status === 401) {
        setErrorMessage('Session expired or invalid token. Please log in again.');
        setNeedsLogin(true);
      } else {
        setErrorMessage(`Failed to check calendar: ${error.response?.data?.Message || error.message}`);
      }
      setCalendarExists(false);
      return false;
    } finally {
      setIsFetching

(false);
    }
  }, [axiosInstance, isAuthenticated]);

  const fetchCalendarDetails = useCallback(async (periodId) => {
    if (!periodId || !isAuthenticated) return;

    setIsFetching(true);
    setErrorMessage('');
    try {
      const response = await axiosInstance.get(`?periodId=${periodId}`);
      setCalendarDetails(response.data);
      setCalendarExists(response.data.length > 0);
      if (response.data.length === 0) {
        setErrorMessage(`No calendar found for Period ID ${periodId}. Please upload one.`);
      }
    } catch (error) {
      const status = error.response?.status;
      if (status === 400 || status === 401) {
        setErrorMessage('Session expired or invalid token. Please log in again.');
        setNeedsLogin(true);
      } else {
        setErrorMessage(`Failed to fetch calendar details: ${error.response?.data?.Message || error.message}`);
      }
      setCalendarExists(false);
    } finally {
      setIsFetching(false);
    }
  }, [axiosInstance, isAuthenticated]);

  const importCalendar = async (periodId, file) => {
    if (!periodId || !file) {
      setErrorMessage('Period ID and Excel file are required.');
      return false;
    }

    if (!isAuthenticated) {
      setErrorMessage('Please log in to continue.');
      setNeedsLogin(true);
      return false;
    }

    const exists = await checkCalendarExists(periodId);
    if (exists) {
      setErrorMessage(`A calendar already exists for Period ID ${periodId}.`);
      return false;
    }

    setIsImporting(true);
    setErrorMessage('');
    try {
      const formData = new FormData();
      formData.append('excelFile', file);
      formData.append('periodId', periodId);

      const response = await axiosInstance.post('/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if ([200, 201].includes(response.status)) {
        setSuccessMessage('Calendar imported successfully.');
        await fetchCalendarDetails(periodId);
        return true;
      }
      throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
      const status = error.response?.status;
      setErrorMessage(
        status === 409
          ? 'A calendar already exists for this period.'
          : status === 500
            ? 'Failed to import calendar. Ensure Excel file is correctly formatted.'
            : `Failed to import calendar: ${error.response?.data?.Message || error.message}`
      );
      if ([400, 401].includes(status)) setNeedsLogin(true);
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  const handleLoginRedirect = () => {
    dispatch(logout());
    navigate('/login');
  };

  return {
    calendarDetails,
    successMessage,
    errorMessage,
    isFetching,
    isImporting,
    needsLogin,
    calendarExists,
    checkCalendarExists,
    fetchCalendarDetails,
    importCalendar,
    handleLoginRedirect,
  };
};

export { useCalendarDetailSlice };