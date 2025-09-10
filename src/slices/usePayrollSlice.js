import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const usePayrollSlice = (baseUrl = 'https://localhost:14686/api/PayrollGeneration') => {
  const [payrolls, setPayrolls] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [config, setConfig] = useState(null);

  const timeoutIds = useRef([]);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const token = localStorage.getItem('token');

  const axiosInstance = useRef(
    axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      timeout: 10000,
    })
  ).current;

  // Fetch payroll reports
  const fetchPayrollReports = useCallback(async (periodId) => {
    if (!periodId) {
      setErrorMessage('Period ID is required.');
      return;
    }
    if (retryCount.current >= maxRetries) {
      setErrorMessage('Failed to fetch payroll reports after multiple attempts.');
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    try {
      const response = await axiosInstance.get(`/reports/${periodId}`);
      const mappedPayrolls = Object.entries(response.data).map(([employeeId, result]) => ({
        employeeId,
        periodId: result.PeriodID,
        employeeName: result.EmployeeName || 'Unknown',
        grossEarnings: result.GrossEarnings || 0,
        totalDeductions: result.TotalDeductions || 0,
        netSalary: result.NetSalary || 0,
        earnings: result.Earnings || [],
        deductions: result.Deductions || [],
        errorMessage: result.ErrorMessage || null,
      }));
      setPayrolls(mappedPayrolls);
      retryCount.current = 0;
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to fetch payroll reports: ${error.response.status} - ${error.response.statusText}`
        : `Failed to fetch payroll reports: ${error.message}`;
      console.error(errorMsg);
      setErrorMessage(errorMsg);
      retryCount.current += 1;
    } finally {
      setIsFetching(false);
    }
  }, [axiosInstance]);

  // Generate payroll
  const generatePayroll = async (periodId) => {
    if (!periodId) {
      setErrorMessage('Period ID is required.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Payroll generation timed out'), 15000);
    timeoutIds.current.push(timeoutId);

    try {
      const response = await axiosInstance.get(`/generate/${periodId}`);
      const mappedPayrolls = Object.entries(response.data).map(([employeeId, result]) => ({
        employeeId,
        periodId: result.PeriodID,
        employeeName: result.EmployeeName || 'Unknown',
        grossEarnings: result.GrossEarnings || 0,
        totalDeductions: result.TotalDeductions || 0,
        netSalary: result.NetSalary || 0,
        earnings: result.Earnings || [],
        deductions: result.Deductions || [],
        errorMessage: result.ErrorMessage || null,
      }));
      setPayrolls(mappedPayrolls);
      setSuccessMessage('Payroll generated successfully');
      const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
      timeoutIds.current.push(successTimeout);
      return mappedPayrolls;
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to generate payroll: ${error.response.status} - ${error.response.statusText}`
        : `Failed to generate payroll: ${error.message}`;
      console.error(errorMsg);
      setErrorMessage(errorMsg);
      const errorTimeout = setTimeout(() => setErrorMessage(''), 10000);
      timeoutIds.current.push(errorTimeout);
      throw error;
    } finally {
      setIsGenerating(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  // Download payroll
  const downloadPayroll = async (periodId, employeeIds = []) => {
    if (!periodId) {
      setErrorMessage('Period ID is required.');
      return;
    }

    setIsDownloading(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Download timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const response = await axiosInstance.get(`/download/${periodId}`, {
        params: { employeeIds: employeeIds.join(',') },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payroll_${periodId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccessMessage('Payroll downloaded successfully');
      const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
      timeoutIds.current.push(successTimeout);
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to download payroll: ${error.response.status}`
        : `Failed to download payroll: ${error.message}`;
      console.error(errorMsg);
      setErrorMessage(errorMsg);
      const errorTimeout = setTimeout(() => setErrorMessage(''), 10000);
      timeoutIds.current.push(errorTimeout);
    } finally {
      setIsDownloading(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  // Fetch and update configuration
  const fetchConfig = useCallback(async () => {
    setIsFetching(true);
    setErrorMessage('');
    try {
      const response = await axiosInstance.get('/config');
      setConfig(response.data);
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to fetch configuration: ${error.response.status}`
        : `Failed to fetch configuration: ${error.message}`;
      console.error(errorMsg);
      setErrorMessage(errorMsg);
    } finally {
      setIsFetching(false);
    }
  }, [axiosInstance]);

  const updateConfig = async (payload) => {
    setIsGenerating(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Configuration update timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const response = await axiosInstance.put('/config', payload);
      setConfig(response.data);
      setSuccessMessage('Configuration updated successfully');
      const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
      timeoutIds.current.push(successTimeout);
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to update configuration: ${error.response.status}`
        : `Failed to update configuration: ${error.message}`;
      console.error(errorMsg);
      setErrorMessage(errorMsg);
      const errorTimeout = setTimeout(() => setErrorMessage(''), 10000);
      timeoutIds.current.push(errorTimeout);
    } finally {
      setIsGenerating(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  useEffect(() => {
    return () => {
      timeoutIds.current.forEach(clearTimeout);
    };
  }, []);

  return {
    payrolls,
    successMessage,
    errorMessage,
    isFetching,
    isGenerating,
    isDownloading,
    config,
    fetchPayrollReports,
    generatePayroll,
    downloadPayroll,
    fetchConfig,
    updateConfig,
  };
};

export { usePayrollSlice };
