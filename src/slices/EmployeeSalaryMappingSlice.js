import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const useEmployeeSalaryMappingSlice = (
  baseUrl = 'https://localhost:14686/api',
  employeeEndpoint = '/Employee',
  earningsEndpoint = '/Earnings',
  deductionsEndpoint = '/Deduction'
) => {
  const [mappings, setMappings] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);

  const retryCount = useMemo(() => ({ current: 0 }), []);
  const maxRetries = 3;
  const token = localStorage.getItem('token');

  // Debug token and check expiration
  useEffect(() => {
    console.log('Token from localStorage:', token);
    console.log('Using baseUrl:', baseUrl);
    if (!token) {
      console.warn('No token found in localStorage. Authentication may fail.');
      setErrorMessage('No authentication token found. Please log in.');
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        const expiry = payload.exp * 1000;
        if (Date.now() > expiry) {
          console.warn('Token is expired.');
          setErrorMessage('Authentication token has expired. Please log in again.');
        }
      } catch (e) {
        console.warn('Unable to decode token:', e.message);
        setErrorMessage('Invalid authentication token. Please log in again.');
      }
    }
  }, [token, baseUrl]);

  // Create Axios instance with useMemo to handle baseUrl/token changes
  const axiosInstance = useMemo(
    () =>
      axios.create({
        baseURL: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        timeout: 10000,
      }),
    [baseUrl, token]
  );

  const fetchEmployeeSalaryMappings = useCallback(
    async ({ periodId = null } = {}) => {
      if (!token || errorMessage.includes('token')) {
        return;
      }

      if (retryCount.current >= maxRetries) {
        setErrorMessage('Failed to fetch salary mappings after multiple attempts. Check server connectivity.');
        return;
      }

      setIsFetching(true);
      setErrorMessage('');
      try {
        console.log('Fetching mappings with config:', {
          employeeUrl: employeeEndpoint,
          earningsUrl: earningsEndpoint,
          deductionsUrl: deductionsEndpoint,
          headers: axiosInstance.defaults.headers,
        });

        const [employeeResponse, earningsResponse, deductionsResponse] = await Promise.all([
          axiosInstance.get(employeeEndpoint),
          axiosInstance.get(earningsEndpoint),
          axiosInstance.get(deductionsEndpoint),
        ]);

        const employees = Array.isArray(employeeResponse.data) ? employeeResponse.data : [];
        const earnings = Array.isArray(earningsResponse.data) ? earningsResponse.data : [];
        const deductions = Array.isArray(deductionsResponse.data) ? deductionsResponse.data : [];

        console.log(
          `Fetched ${employees.length} employees, ${earnings.length} earnings, ${deductions.length} deductions`
        );

        // Warn if periodId is provided but not supported
        if (periodId) {
          console.warn(
            'PeriodID filtering not supported by backend. Using client-side filtering with PeriodName.'
          );
        }

        const mappedData = employees.map(emp => {
          // Filter earnings by EmployeeName and PeriodName (since EmployeeID and PeriodID are not available)
          const empEarnings = earnings.filter(
            e => e.EmployeeName === emp.FullName && (!periodId || e.PeriodName === periodId)
          );
          const empDeductions = deductions.filter(
            d => d.EmployeeID === emp.EmployeeID && (!periodId || d.PeriodID === periodId)
          );

          const totalEarnings = parseFloat(
            empEarnings.reduce((sum, e) => sum + Number(e.Amount || 0), 0).toFixed(2)
          );
          const totalDeductions = parseFloat(
            empDeductions.reduce((sum, d) => sum + Number(d.Amount || 0), 0).toFixed(2)
          );

          return {
            EmployeeID: emp.EmployeeID || 'N/A',
            FullName: emp.FullName || 'N/A',
            TotalEarnings: totalEarnings,
            TotalDeductions: totalDeductions,
            CreatedAt: emp.CreatedAt || null,
            UpdatedAt: emp.UpdatedAt || null,
            EarningsDetail: empEarnings.map(e => ({
              EarningID: e.EarningID || 'N/A',
              EarningTypeName: e.EarningTypeName || 'N/A',
              Amount: parseFloat(Number(e.Amount || 0).toFixed(2)),
              Taxability: e.Taxability || 'N/A',
              IsBasic: e.IsBasic || false,
              StartDate: e.StartDate || null,
              EndDate: e.EndDate || null,
            })),
            DeductionsDetail: empDeductions.map(d => ({
              DeductionID: d.DeductionID || 'N/A',
              DeductionTypeName: d.DeductionTypeName || 'N/A',
              Amount: parseFloat(Number(d.Amount || 0).toFixed(2)),
              StartDate: d.StartDate || null,
              EndDate: d.EndDate || null,
            })),
          };
        });

        setMappings(mappedData);
        setSuccessMessage('Salary mappings fetched successfully');
        retryCount.current = 0;
      } catch (error) {
        const errorMsg = error.response
          ? `Failed to fetch salary mappings: ${error.response.status} - ${error.response.statusText} - ${error.response.data?.message || 'No details'}`
          : `Failed to fetch salary mappings: ${error.message}`;
        console.error('Fetch error details:', error, { config: error.config, response: error.response });
        setErrorMessage(errorMsg);

        if (!error.response || error.response.status >= 500) {
          retryCount.current += 1;
        } else {
          retryCount.current = 0;
          if (error.response?.status === 401) {
            console.warn('401 Unauthorized: Ensure token includes required role and is valid.');
          } else if (error.response?.status === 404) {
            console.warn('404 Not Found: Check if the server is running at', baseUrl, 'or if endpoints are registered.');
          }
        }
      } finally {
        setIsFetching(false);
      }
    },
    [axiosInstance, baseUrl, employeeEndpoint, earningsEndpoint, deductionsEndpoint, errorMessage, token]
  );

  useEffect(() => {
    fetchEmployeeSalaryMappings();
  }, [fetchEmployeeSalaryMappings]);

  useEffect(() => {
    if (successMessage) {
      const timeoutId = setTimeout(() => setSuccessMessage(''), 10000);
      return () => clearTimeout(timeoutId);
    }
  }, [successMessage]);

  return {
    mappings,
    successMessage,
    errorMessage,
    isFetching,
    fetchEmployeeSalaryMappings,
  };
};

export { useEmployeeSalaryMappingSlice };