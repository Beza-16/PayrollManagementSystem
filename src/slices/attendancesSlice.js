// import { useState, useEffect, useCallback, useRef } from 'react';
// import axios from 'axios';

// const useAttendanceSlice = (baseUrl = 'https://localhost:14686/api/Attendance') => {
//   const [attendances, setAttendances] = useState([]);
//   const [employees, setEmployees] = useState([]);
//   const [shifts, setShifts] = useState([]);
//   const [successMessage, setSuccessMessage] = useState('');
//   const [errorMessage, setErrorMessage] = useState('');
//   const [isFetching, setIsFetching] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const timeoutIds = useRef([]);
//   const retryCount = useRef(0);
//   const maxRetries = 3;

//   const token = localStorage.getItem('token');

//   useEffect(() => {
//     console.log('Token from localStorage:', token);
//     console.log('Using baseUrl:', baseUrl);
//     if (!token) {
//       console.warn('No token found in localStorage. Authentication may fail.');
//     } else {
//       try {
//         const payload = JSON.parse(atob(token.split('.')[1]));
//         console.log('Token payload:', payload);
//       } catch (e) {
//         console.warn('Unable to decode token:', e.message);
//       }
//     }
//   }, [token, baseUrl]);

//   const axiosInstance = useRef(
//     axios.create({
//       baseURL: baseUrl,
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: token ? `Bearer ${token}` : '',
//       },
//       timeout: 10000,
//     })
//   ).current;

//   const fetchAllAttendances = useCallback(async () => {
//     if (retryCount.current >= maxRetries) {
//       setErrorMessage('Failed to fetch attendances after multiple attempts. Check authentication or server.');
//       return;
//     }

//     setIsFetching(true);
//     setErrorMessage('');
//     try {
//       console.log('Request config:', { url: '', headers: axiosInstance.defaults.headers });
//       const response = await axiosInstance.get('');
//       console.log(`Fetched ${response.data.length} attendances. Full response:`, response.data);

//       const mappedAttendances = response.data.map((attendance) => ({
//         attendanceId: attendance.attendanceId,
//         employeeId: attendance.employeeId,
//         employeeName: attendance.employeeName,
//         periodId: attendance.periodId,
//         shiftId: attendance.shiftId,
//         inTime: attendance.inTime,
//         outTime: attendance.outTime,
//         status: attendance.status,
//         workHours: attendance.workHours,
//         lateMinutes: attendance.lateMinutes,
//         earlyLeaveMinutes: attendance.earlyLeaveMinutes,
//         overtimeHours: attendance.overtimeHours,
//         date: attendance.date,
//         inLatitude: attendance.inLatitude,
//         inLongitude: attendance.inLongitude,
//         outLatitude: attendance.outLatitude,
//         outLongitude: attendance.outLongitude,
//         timeInPhotoUrl: attendance.timeInPhotoUrl,
//         timeOutPhotoUrl: attendance.timeOutPhotoUrl,
//         notes: attendance.notes,
//         approvalStatus: attendance.approvalStatus,
//         createdAt: attendance.createdAt,
//         updatedAt: attendance.updatedAt,
//         department: attendance.department,
//         branchName: attendance.branchName,
//       }));

//       setAttendances(mappedAttendances);
//       retryCount.current = 0;
//     } catch (error) {
//       const errorMsg = error.response
//         ? `Failed to fetch attendances: ${error.response.status} - ${error.response.statusText} - ${error.response.data?.error || 'No details'}`
//         : `Failed to fetch attendances: ${error.message}`;
//       console.error('Fetch error details:', error, { config: error.config, response: error.response });
//       setErrorMessage(errorMsg);
//       if (error.response?.status === 401) {
//         console.warn('401 Unauthorized: Ensure token includes "Admin" role and is valid.');
//       } else if (error.response?.status === 404) {
//         console.warn('404 Not Found: Check if the server is running at', baseUrl);
//       }
//       retryCount.current += 1;
//     } finally {
//       setIsFetching(false);
//     }
//   }, [axiosInstance, baseUrl]);

//   const fetchAllEmployees = useCallback(async () => {
//     try {
//       const response = await axios.create({
//         baseURL: 'https://localhost:14686/api/Employee',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: token ? `Bearer ${token}` : '',
//         },
//         timeout: 10000,
//       }).get('');
//       console.log(`Fetched ${response.data.length} employees.`);
//       setEmployees(response.data.map((emp) => ({
//         employeeId: emp.EmployeeID,
//         fullName: emp.FullName,
//       })));
//     } catch (error) {
//       console.error('Failed to fetch employees:', error);
//     }
//   }, [token]);

//   const fetchAllShifts = useCallback(async () => {
//     try {
//       const response = await axios.create({
//         baseURL: 'https://localhost:14686/api/ShiftSchedule',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: token ? `Bearer ${token}` : '',
//         },
//         timeout: 10000,
//       }).get('');
//       console.log(`Fetched ${response.data.length} shifts.`);
//       setShifts(response.data.map((shift) => ({
//         shiftId: shift.ShiftID,
//         name: shift.Name || `Shift ${shift.ShiftID}`,
//         startTime: shift.StartTime,
//         endTime: shift.EndTime,
//       })));
//     } catch (error) {
//       console.error('Failed to fetch shifts:', error);
//     }
//   }, [token]);

//   const handleAction = async (payload, isUpdate = false) => {
//     setIsSubmitting(true);
//     setErrorMessage('');
//     const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
//     timeoutIds.current.push(timeoutId);

//     try {
//       let response;
//       if (isUpdate) {
//         response = await axiosInstance.put(`${payload.attendanceId}`, {
//           outTime: payload.outTime,
//           notes: payload.notes,
//           approvalStatus: payload.approvalStatus,
//         });
//       } else {
//         response = await axiosInstance.post('', {
//           employeeId: payload.employeeId,
//           periodId: '00000000-0000-0000-0000-000000000000', // Placeholder, adjust as needed
//           shiftId: payload.shiftId,
//           inTime: payload.inTime,
//           outTime: payload.outTime,
//           status: payload.status,
//           date: payload.date,
//           notes: payload.notes,
//           approvalStatus: payload.approvalStatus,
//         });
//       }

//       if ([200, 201, 204].includes(response.status)) {
//         setSuccessMessage(`Attendance ${isUpdate ? 'updated' : 'created'} successfully`);
//         await fetchAllAttendances();
//         const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
//         timeoutIds.current.push(successTimeout);
//         return response.data;
//       } else {
//         throw new Error(`Unexpected status code: ${response.status}`);
//       }
//     } catch (error) {
//       const errorMsg = error.response
//         ? `Failed to ${isUpdate ? 'update' : 'create'} attendance: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`
//         : `Failed to ${isUpdate ? 'update' : 'create'} attendance: ${error.message}`;
//       console.error('Action error details:', error.response?.data || error);
//       setErrorMessage(errorMsg);
//       if (error.response?.status === 400) {
//         console.warn('400 Bad Request: Check payload structure.');
//       } else if (error.response?.status === 401) {
//         console.warn('401 Unauthorized: Ensure token includes "Admin" role and is valid.');
//       }
//       const errorTimeout = setTimeout(() => setErrorMessage(''), 10000);
//       timeoutIds.current.push(errorTimeout);
//       throw error;
//     } finally {
//       setIsSubmitting(false);
//       clearTimeout(timeoutId);
//       timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
//     }
//   };

//   return {
//     attendances,
//     employees,
//     shifts,
//     successMessage,
//     errorMessage,
//     isFetching,
//     isSubmitting,
//     fetchAllAttendances,
//     fetchAllEmployees,
//     fetchAllShifts,
//     handleAction,
//   };
// };

// export { useAttendanceSlice };


import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const useAttendanceSlice = (baseUrl = 'https://localhost:14686/api/Attendance') => {
  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeoutIds = useRef([]);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const token = localStorage.getItem('token');

  useEffect(() => {
    console.log('Token from localStorage:', token);
    console.log('Using baseUrl:', baseUrl);
    if (!token) {
      console.warn('No token found in localStorage. Authentication may fail.');
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        const exp = payload.exp ? new Date(payload.exp * 1000) : null;
        if (exp && exp < new Date()) {
          console.warn('Token expired at:', exp.toISOString());
          setErrorMessage('Session expired. Please log in again.');
        }
      } catch (e) {
        console.warn('Unable to decode token:', e.message);
      }
    }
  }, [token, baseUrl]);

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

  const fetchAllAttendances = useCallback(async () => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage(`Failed to fetch attendances after ${maxRetries} attempts. Check authentication or server.`);
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    try {
      console.log('Fetching attendances from:', `${baseUrl}/`);
      const response = await axiosInstance.get('/');
      console.log('Raw API response:', response.data); // Log the raw response for debugging

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format: Expected an array of attendances');
      }

      const mappedAttendances = response.data.map((attendance) => {
        console.log('Mapping attendance:', attendance); // Log each attendance object
        return {
          attendanceId: attendance.AttendanceID || attendance.attendanceId || 'N/A',
          employeeId: attendance.EmployeeID || attendance.employeeId || 'N/A',
          employeeName: attendance.EmployeeName || attendance.employeeName || 'N/A',
          periodId: attendance.PeriodID || attendance.periodId || 'N/A',
          shiftId: attendance.ShiftID || attendance.shiftId || 'N/A',
          inTime: attendance.InTime || attendance.inTime || 'N/A',
          outTime: attendance.OutTime || attendance.outTime || 'N/A',
          status: attendance.Status !== undefined ? attendance.Status : attendance.status || 'N/A',
          workHours: attendance.WorkHours || attendance.workHours || 0,
          lateMinutes: attendance.LateMinutes || attendance.lateMinutes || 0,
          earlyLeaveMinutes: attendance.EarlyLeaveMinutes || attendance.earlyLeaveMinutes || 0,
          overtimeHours: attendance.OvertimeHours || attendance.overtimeHours || 0,
          date: attendance.Date || attendance.date || 'N/A',
          inLatitude: attendance.InLatitude || attendance.inLatitude || null,
          inLongitude: attendance.InLongitude || attendance.inLongitude || null,
          outLatitude: attendance.OutLatitude || attendance.outLatitude || null,
          outLongitude: attendance.OutLongitude || attendance.outLongitude || null,
          timeInPhotoUrl: attendance.TimeInPhotoUrl || attendance.timeInPhotoUrl || 'N/A',
          timeOutPhotoUrl: attendance.TimeOutPhotoURL || attendance.timeOutPhotoUrl || 'N/A',
          notes: attendance.Notes || attendance.notes || 'N/A',
          approvalStatus: attendance.ApprovalStatus !== undefined ? attendance.ApprovalStatus : attendance.approvalStatus || 'N/A',
          createdAt: attendance.CreatedAt || attendance.createdAt || 'N/A',
          updatedAt: attendance.UpdatedAt || attendance.updatedAt || 'N/A',
          department: attendance.Department || attendance.department || 'N/A',
          branchName: attendance.BranchName || attendance.branchName || 'N/A',
        };
      });

      console.log('Mapped attendances:', mappedAttendances); // Log the mapped data
      setAttendances(mappedAttendances);
      retryCount.current = 0;
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to fetch attendances: ${error.response.status} - ${error.response.statusText} - ${error.response.data?.error || 'No details'}`
        : `Failed to fetch attendances: ${error.message}`;
      console.error('Fetch error details:', error, { config: error.config, response: error.response });
      setErrorMessage(errorMsg);
      if (error.response?.status === 401) {
        console.warn('401 Unauthorized: Ensure token includes "Admin" role and is valid.');
      } else if (error.response?.status === 404) {
        console.warn('404 Not Found: Check if the server is running at', baseUrl);
      }
      retryCount.current += 1;
      if (retryCount.current < maxRetries) {
        console.log(`Retrying fetch... Attempt ${retryCount.current + 1}/${maxRetries}`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount.current));
        await fetchAllAttendances();
      }
    } finally {
      setIsFetching(false);
    }
  }, [axiosInstance, baseUrl]);

  const fetchAllEmployees = useCallback(async () => {
    try {
      const response = await axios.create({
        baseURL: 'https://localhost:14686/api/Employee',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        timeout: 10000,
      }).get('');
      console.log(`Fetched ${response.data.length} employees.`);
      setEmployees(response.data.map((emp) => ({
        employeeId: emp.EmployeeID,
        fullName: emp.FullName,
      })));
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setErrorMessage('Failed to fetch employees. Check server connection.');
    }
  }, [token]);

  const fetchAllShifts = useCallback(async () => {
    try {
      const response = await axios.create({
        baseURL: 'https://localhost:14686/api/ShiftSchedule',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        timeout: 10000,
      }).get('');
      console.log(`Fetched ${response.data.length} shifts.`);
      setShifts(response.data.map((shift) => ({
        shiftId: shift.ShiftID,
        name: shift.Name || `Shift ${shift.ShiftID}`,
        startTime: shift.StartTime,
        endTime: shift.EndTime,
      })));
    } catch (error) {
      console.error('Failed to fetch shifts:', error);
      setErrorMessage('Failed to fetch shifts. Check server connection.');
    }
  }, [token]);

  const handleAction = async (payload, isUpdate = false) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      let response;
      if (isUpdate) {
        response = await axiosInstance.put(`/${payload.attendanceId}`, {
          OutTime: payload.outTime,
          Notes: payload.notes,
          ApprovalStatus: payload.approvalStatus,
        });
      } else {
        response = await axiosInstance.post('/', {
          EmployeeId: payload.employeeId,
          PeriodId: payload.periodId || '00000000-0000-0000-0000-000000000000',
          ShiftId: payload.shiftId,
          InTime: payload.inTime,
          OutTime: payload.outTime,
          Status: payload.status,
          Date: payload.date,
          Notes: payload.notes,
          ApprovalStatus: payload.approvalStatus,
          Latitude: payload.latitude,
          Longitude: payload.longitude,
        });
      }

      if ([200, 201, 204].includes(response.status)) {
        setSuccessMessage(`Attendance ${isUpdate ? 'updated' : 'created'} successfully`);
        await fetchAllAttendances();
        const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
        timeoutIds.current.push(successTimeout);
        return response.data;
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to ${isUpdate ? 'update' : 'create'} attendance: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`
        : `Failed to ${isUpdate ? 'update' : 'create'} attendance: ${error.message}`;
      console.error('Action error details:', error.response?.data || error);
      setErrorMessage(errorMsg);
      if (error.response?.status === 400) {
        console.warn('400 Bad Request: Check payload structure.');
      } else if (error.response?.status === 401) {
        console.warn('401 Unauthorized: Ensure token includes "Admin" role and is valid.');
      }
      const errorTimeout = setTimeout(() => setErrorMessage(''), 10000);
      timeoutIds.current.push(errorTimeout);
      throw error;
    } finally {
      setIsSubmitting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  useEffect(() => {
    return () => timeoutIds.current.forEach(clearTimeout);
  }, []);

  return {
    attendances,
    employees,
    shifts,
    successMessage,
    errorMessage,
    isFetching,
    isSubmitting,
    fetchAllAttendances,
    fetchAllEmployees,
    fetchAllShifts,
    handleAction,
  };
};

export { useAttendanceSlice };