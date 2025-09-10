// import React, { useState, useEffect, useCallback } from 'react';
// import { FaEdit, FaPlus, FaMinus } from 'react-icons/fa';
// import AttendanceForm from '../components/AttendanceForm';
// import { useAttendanceSlice } from '../slices/attendancesSlice';
// import '../styles/AttendancePage.css';
// import * as XLSX from 'xlsx';
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';

// // Convert decimal hours (e.g., 0.01) to "xh ym"
// function formatWorkHours(decimalHours) {
//   const totalMinutes = Math.round(decimalHours * 60);
//   const hours = Math.floor(totalMinutes / 60);
//   const minutes = totalMinutes % 60;
//   return `${hours}h ${minutes}m`;
// }

// // Convert minutes (e.g., 348) to "xh ym"
// function formatMinutes(totalMinutes) {
//   const hours = Math.floor(totalMinutes / 60);
//   const minutes = totalMinutes % 60;
//   return `${hours}h ${minutes}m`;
// }

// // Mock function to map shiftId to a user-friendly shift name and time range
// const getShiftDetails = (shiftId) => {
//   const shiftMap = {
//     'e2851311-3a28-4434-90ef-c4ac41d1b885': { name: 'Morning Shift', time: '8:00 AM - 4:00 PM' },
//     // Add more mappings as needed, e.g.:
//     // 'another-shift-id': { name: 'Evening Shift', time: '4:00 PM - 12:00 AM' },
//     // 'yet-another-shift-id': { name: 'Night Shift', time: '12:00 AM - 8:00 AM' },
//   };
//   const shift = shiftMap[shiftId] || { name: 'Unknown Shift', time: 'N/A' };
//   return `${shift.name}: ${shift.time}`;
// };

// // Function to get styled status text
// const getStatusText = (status) => {
//   switch (status) {
//     case 0: return 'Absent';
//     case 1: return 'Present';
//     case 4: return 'Half-day';
//     default: return 'N/A';
//   }
// };

// // Function to get styled approval status text
// const getApprovalStatusText = (approvalStatus) => {
//   switch (approvalStatus) {
//     case 0: return 'Pending';
//     case 1: return 'Approved';
//     case 2: return 'Rejected';
//     default: return 'N/A';
//   }
// };

// const AttendancePage = () => {
//   const { attendances, handleAction, successMessage, errorMessage, fetchAllAttendances, isFetching } = useAttendanceSlice();
//   const [searchTerm, setSearchTerm] = useState('');
//   const [departmentFilter, setDepartmentFilter] = useState('');
//   const [dateFilter, setDateFilter] = useState('');
//   const [showAttendanceModal, setShowAttendanceModal] = useState(false);
//   const [selectedAttendance, setSelectedAttendance] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [expandedRows, setExpandedRows] = useState({});
//   const [locationNames, setLocationNames] = useState({});
//   const attendancesPerPage = 5;

//   useEffect(() => {
//     fetchAllAttendances();
//   }, [fetchAllAttendances]);

//   useEffect(() => {
//     attendances?.forEach((attendance, index) => {
//       console.log(`Attendance ${index}:`, JSON.stringify(attendance, null, 2));
//     });
//   }, [attendances]);

//   const getLocationName = useCallback(async (latitude, longitude, attendanceId, type) => {
//     if (!latitude || !longitude) return 'N/A';
//     const cacheKey = `${attendanceId}-${type}`;
//     if (locationNames[cacheKey]) return locationNames[cacheKey];

//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
//         { headers: { 'User-Agent': 'PayrollApp/1.0' } }
//       );
//       const data = await response.json();

//       const { address } = data;
//       const parts = [
//         address?.attraction,
//         address?.amenity,
//         address?.tourism,
//         address?.building,
//         address?.house,
//         address?.road,
//         address?.suburb,
//         address?.city
//       ].filter(Boolean);

//       const name = parts[0] || 'Unknown Location';
//       setLocationNames((prev) => ({ ...prev, [cacheKey]: name }));
//       return name;
//     } catch {
//       setLocationNames((prev) => ({ ...prev, [cacheKey]: 'Unknown Location' }));
//       return 'Unknown Location';
//     }
//   }, [locationNames]);

//   useEffect(() => {
//     const fetchLocations = async () => {
//       const promises = [];
//       attendances?.forEach((attendance) => {
//         if (expandedRows[attendance.attendanceId]) {
//           if (attendance.inLatitude && attendance.inLongitude) {
//             promises.push(getLocationName(attendance.inLatitude, attendance.inLongitude, attendance.attendanceId, 'in'));
//           }
//           if (attendance.outLatitude && attendance.outLongitude) {
//             promises.push(getLocationName(attendance.outLatitude, attendance.outLongitude, attendance.attendanceId, 'out'));
//           }
//         }
//       });
//       await Promise.all(promises);
//     };
//     fetchLocations();
//   }, [attendances, expandedRows, getLocationName]);

//   const filteredAttendances = attendances?.filter((attendance) => {
//     const matchesSearch = (attendance?.employeeName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
//     const matchesDepartment = !departmentFilter || (attendance?.department?.toLowerCase() || '').includes(departmentFilter.toLowerCase());
//     const matchesDate = !dateFilter || (attendance?.date || '').startsWith(dateFilter);
//     return matchesSearch && matchesDepartment && matchesDate;
//   }) || [];

//   const indexOfLastAttendance = currentPage * attendancesPerPage;
//   const indexOfFirstAttendance = indexOfLastAttendance - attendancesPerPage;
//   const currentAttendances = filteredAttendances.slice(indexOfFirstAttendance, indexOfLastAttendance);
//   const totalPages = Math.ceil(filteredAttendances.length / attendancesPerPage);

//   const toggleRow = (attendanceId) => {
//     setExpandedRows((prev) => ({
//       ...prev,
//       [attendanceId]: !prev[attendanceId],
//     }));
//   };

//   const handleManageAttendance = (attendance) => {
//     setSelectedAttendance(attendance);
//     setShowAttendanceModal(true);
//   };

//   const handleCloseAttendanceModal = async () => {
//     await fetchAllAttendances();
//     setShowAttendanceModal(false);
//     setSelectedAttendance(null);
//     setCurrentPage(1);
//   };

//   const handlePrevPage = () => {
//     if (currentPage > 1) setCurrentPage(currentPage - 1);
//   };

//   const handleNextPage = () => {
//     if (currentPage < totalPages) setCurrentPage(currentPage + 1);
//   };

//   const exportToExcel = () => {
//     const worksheet = XLSX.utils.json_to_sheet(filteredAttendances.map((attendance) => ({
//       'Employee Name': attendance.employeeName || 'N/A',
//       'Date': attendance.date || 'N/A',
//       'Check In': attendance.inTime || 'N/A',
//       'Check Out': attendance.outTime || 'N/A',
//       'Status': getStatusText(attendance.status),
//       'Approval Status': getApprovalStatusText(attendance.approvalStatus),
//       'Department': attendance.department || 'N/A',
//       'Branch': attendance.branchName || 'N/A',
//       'Shift': getShiftDetails(attendance.shiftId) || 'N/A',
//       'Work Hours': formatWorkHours(attendance.workHours) || 'N/A',
//       'Late Minutes': formatMinutes(attendance.lateMinutes) || 'N/A',
//       'Overtime Hours': formatWorkHours(attendance.overtimeHours) || 'N/A',
//       'Early Leave Minutes': formatMinutes(attendance.earlyLeaveMinutes) || 'N/A',
//       'In Location': locationNames[`${attendance.attendanceId}-in`] || 'N/A',
//       'Out Location': locationNames[`${attendance.attendanceId}-out`] || 'N/A',
//     })));
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendances');
//     XLSX.writeFile(workbook, 'attendances.xlsx');
//   };

//   const exportToPDF = () => {
//     const doc = new jsPDF();
//     doc.text('Attendance Records', 14, 20);
//     doc.autoTable({
//       startY: 30,
//       head: [['Employee Name', 'Date', 'Check In', 'Check Out', 'Status', 'Approval Status', 'Department', 'Branch', 'Shift', 'Work Hours', 'Late Minutes', 'Overtime Hours', 'Early Leave Minutes', 'In Location', 'Out Location']],
//       body: filteredAttendances.map((attendance) => [
//         attendance.employeeName || 'N/A',
//         attendance.date || 'N/A',
//         attendance.inTime || 'N/A',
//         attendance.outTime || 'N/A',
//         getStatusText(attendance.status),
//         getApprovalStatusText(attendance.approvalStatus),
//         attendance.department || 'N/A',
//         attendance.branchName || 'N/A',
//         getShiftDetails(attendance.shiftId) || 'N/A',
//         formatWorkHours(attendance.workHours) || 'N/A',
//         formatMinutes(attendance.lateMinutes) || 'N/A',
//         formatWorkHours(attendance.overtimeHours) || 'N/A',
//         formatMinutes(attendance.earlyLeaveMinutes) || 'N/A',
//         locationNames[`${attendance.attendanceId}-in`] || 'N/A',
//         locationNames[`${attendance.attendanceId}-out`] || 'N/A',
//       ]),
//     });
//     doc.save('attendances.pdf');
//   };

//   return (
//     <div className="attendance-page-container">
//       <div className="header-section">
//         <h2>Attendance Management</h2>
//         <div>
//           <button className="export-btn" onClick={exportToExcel}>Export to Excel</button>
//           <button className="export-btn" onClick={exportToPDF}>Export to PDF</button>
//           <button className="add-btn" onClick={() => handleManageAttendance(null)}>Add Attendance</button>
//         </div>
//       </div>

//       {errorMessage && <div className="error-message">{errorMessage}</div>}
//       {successMessage && <div className="success-message">{successMessage}</div>}
//       {isFetching && <div className="loading-message">Loading attendances...</div>}

//       {showAttendanceModal && (
//         <AttendanceForm
//           attendance={selectedAttendance}
//           onClose={handleCloseAttendanceModal}
//         />
//       )}

//       <div className="table-section">
//         <div className="filter-section">
//           <input
//             type="text"
//             placeholder="Search by employee..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="search-bar"
//           />
//           <input
//             type="text"
//             placeholder="Filter by Department..."
//             value={departmentFilter}
//             onChange={(e) => setDepartmentFilter(e.target.value)}
//             className="filter-input"
//           />
//           <input
//             type="date"
//             placeholder="Filter by Date..."
//             value={dateFilter}
//             onChange={(e) => setDateFilter(e.target.value)}
//             className="filter-input"
//           />
//         </div>
//         <div className="table-wrapper">
//           <table className="attendance-table">
//             <thead>
//               <tr>
//                 <th style={{ width: '50px' }}></th>
//                 <th>Employee Name</th>
//                 <th>Date</th>
//                 <th>Check In</th>
//                 <th>Check Out</th>
//                 <th>Status</th>
//                 <th>Approval Status</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {currentAttendances.length > 0 ? (
//                 currentAttendances.map((attendance) => (
//                   <React.Fragment key={attendance.attendanceId}>
//                     <tr>
//                       <td>
//                         <button
//                           className="action-btn details-btn"
//                           onClick={() => toggleRow(attendance.attendanceId)}
//                           title={expandedRows[attendance.attendanceId] ? 'Hide Details' : 'View Details'}
//                           aria-label={`${expandedRows[attendance.attendanceId] ? 'Hide' : 'Show'} details for ${attendance.employeeName || 'unknown'}`}
//                         >
//                           {expandedRows[attendance.attendanceId] ? <FaMinus /> : <FaPlus />}
//                         </button>
//                       </td>
//                       <td>{attendance.employeeName || 'N/A'}</td>
//                       <td>{attendance.date || 'N/A'}</td>
//                       <td>{attendance.inTime || 'N/A'}</td>
//                       <td>{attendance.outTime || 'N/A'}</td>
//                       <td>
//                         <span className={`status-badge ${getStatusText(attendance.status).toLowerCase().replace(' ', '-')}`}>
//                           {getStatusText(attendance.status)}
//                         </span>
//                       </td>
//                       <td>
//                         <span className={`status-badge ${getApprovalStatusText(attendance.approvalStatus).toLowerCase().replace(' ', '-')}`}>
//                           {getApprovalStatusText(attendance.approvalStatus)}
//                         </span>
//                       </td>
//                       <td className="actions-cell">
//                         <button
//                           className="action-btn manage-btn"
//                           onClick={() => handleManageAttendance(attendance)}
//                           title="Manage"
//                           aria-label={`Manage attendance for ${attendance.employeeName || 'unknown'}`}
//                         >
//                           <FaEdit />
//                         </button>
//                       </td>
//                     </tr>
//                     {expandedRows[attendance.attendanceId] && (
//                       <tr className="details-row">
//                         <td colSpan="8">
//                           <div className="details-content">
//                             <p><strong>Shift:</strong> {getShiftDetails(attendance.shiftId)}</p>
//                             <p><strong>Work Hours:</strong> {formatWorkHours(attendance.workHours)}</p>
//                             <p><strong>Late Minutes:</strong> {formatMinutes(attendance.lateMinutes)}</p>
//                             <p><strong>Overtime Hours:</strong> {formatWorkHours(attendance.overtimeHours)}</p>
//                             <p><strong>Early Leave Minutes:</strong> {formatMinutes(attendance.earlyLeaveMinutes)}</p>
//                             <p>
//                               <strong>In Location:</strong>{' '}
//                               {locationNames[`${attendance.attendanceId}-in`] || 'Loading...'}
//                             </p>
//                             <p>
//                               <strong>Out Location:</strong>{' '}
//                               {locationNames[`${attendance.attendanceId}-out`] || 'Loading...'}
//                             </p>
//                           </div>
//                         </td>
//                       </tr>
//                     )}
//                   </React.Fragment>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan="8">No attendances found</td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//         <div className="table-footer">
//           <button className="nav-btn" onClick={handlePrevPage} disabled={currentPage === 1}>
//             Prev
//           </button>
//           <button className="nav-btn" onClick={handleNextPage} disabled={currentPage === totalPages}>
//             Next
//           </button>
//           <span>Page {currentPage} of {totalPages || 1}</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AttendancePage;


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaEdit, FaPlus, FaMinus } from 'react-icons/fa';
import AttendanceForm from '../components/AttendanceForm';
import { useAttendanceSlice } from '../slices/attendancesSlice';
import '../styles/AttendancePage.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Convert decimal hours (e.g., 0.01) to "xh ym"
function formatWorkHours(decimalHours) {
  if (!decimalHours && decimalHours !== 0) return 'N/A';
  const totalMinutes = Math.round(decimalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

// Convert minutes (e.g., 348) to "xh ym"
function formatMinutes(totalMinutes) {
  if (!totalMinutes && totalMinutes !== 0) return 'N/A';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

// Map shiftId to readable shift details
const getShiftDetails = (shiftId) => {
  const shiftMap = {
    'e2851311-3a28-4434-90ef-c4ac41d1b885': { name: 'Morning Shift', time: '8:00 AM - 4:00 PM' },
    // Add more mappings if needed
  };
  const shift = shiftMap[shiftId] || { name: 'Unknown Shift', time: 'N/A' };
  return `${shift.name}: ${shift.time}`;
};

// ✅ Status text (from backend strings)
const getStatusText = (status) => {
  switch (status) {
    case 'Absent': return { text: 'Absent', class: 'absent' };
    case 'Present': return { text: 'Present', class: 'present' };
    case 'Leave': return { text: 'Leave', class: 'leave' };
    case 'Holiday': return { text: 'Holiday', class: 'holiday' };
    case 'HalfDay': return { text: 'Half-day', class: 'half-day' };
    case 'RestDay': return { text: 'Rest Day', class: 'rest-day' };
    case 'Overtime': return { text: 'Overtime', class: 'overtime' };
    case 'Late': return { text: 'Late', class: 'late' };
    default: return { text: 'N/A', class: 'unknown' };
  }
};

// ✅ Approval status
const getApprovalStatusText = (approvalStatus) => {
  switch (approvalStatus) {
    case 0: return { text: 'Pending', class: 'pending' };
    case 1: return { text: 'Approved', class: 'approved' };
    case 2: return { text: 'Rejected', class: 'rejected' };
    default: return { text: 'N/A', class: 'unknown' };
  }
};

const AttendancePage = () => {
  const { attendances, successMessage, errorMessage, fetchAllAttendances, isFetching } = useAttendanceSlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const [locationNames, setLocationNames] = useState({});
  const attendancesPerPage = 5;
  const locationFetchRef = useRef(new Map());

  useEffect(() => {
    fetchAllAttendances().catch((error) => console.error('Failed to fetch attendances:', error));
  }, [fetchAllAttendances]);

  const getLocationName = useCallback(async (latitude, longitude, attendanceId, type) => {
    if (!latitude || !longitude) return 'N/A';
    const cacheKey = `${attendanceId}-${type}`;
    if (locationNames[cacheKey]) return locationNames[cacheKey];

    const fetchKey = `${latitude},${longitude}`;
    if (locationFetchRef.current.has(fetchKey)) return locationFetchRef.current.get(fetchKey);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        { headers: { 'User-Agent': 'PayrollApp/1.0' } }
      );
      if (!response.ok) throw new Error('Geocoding API failed');
      const data = await response.json();

      const { address } = data;
      const parts = [
        address?.attraction,
        address?.amenity,
        address?.tourism,
        address?.building,
        address?.house,
        address?.road,
        address?.suburb,
        address?.city
      ].filter(Boolean);

      const name = parts[0] || 'Unknown Location';
      locationFetchRef.current.set(fetchKey, name);
      setLocationNames((prev) => ({ ...prev, [cacheKey]: name }));
      return name;
    } catch (error) {
      console.error('Error fetching location:', error);
      locationFetchRef.current.set(fetchKey, 'Unknown Location');
      setLocationNames((prev) => ({ ...prev, [cacheKey]: 'Unknown Location' }));
      return 'Unknown Location';
    }
  }, [locationNames]);

  useEffect(() => {
    const fetchLocations = async () => {
      const promises = [];
      attendances?.forEach((attendance) => {
        if (expandedRows[attendance.attendanceId]) {
          if (attendance.inLatitude && attendance.inLongitude && !locationNames[`${attendance.attendanceId}-in`]) {
            promises.push(getLocationName(attendance.inLatitude, attendance.inLongitude, attendance.attendanceId, 'in'));
          }
          if (attendance.outLatitude && attendance.outLongitude && !locationNames[`${attendance.attendanceId}-out`]) {
            promises.push(getLocationName(attendance.outLatitude, attendance.outLongitude, attendance.attendanceId, 'out'));
          }
        }
      });
      await Promise.all(promises);
    };
    fetchLocations();
  }, [attendances, expandedRows, getLocationName, locationNames]);

  const filteredAttendances = attendances?.filter((attendance) => {
    const matchesSearch = (attendance?.employeeName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || (attendance?.department?.toLowerCase() || '').includes(departmentFilter.toLowerCase());
    const matchesDate = !dateFilter || (attendance?.date || '').startsWith(dateFilter);
    return matchesSearch && matchesDepartment && matchesDate;
  }) || [];

  const indexOfLastAttendance = currentPage * attendancesPerPage;
  const indexOfFirstAttendance = indexOfLastAttendance - attendancesPerPage;
  const currentAttendances = filteredAttendances.slice(indexOfFirstAttendance, indexOfLastAttendance);
  const totalPages = Math.ceil(filteredAttendances.length / attendancesPerPage);

  const toggleRow = (attendanceId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [attendanceId]: !prev[attendanceId],
    }));
  };

  const handleManageAttendance = (attendance) => {
    setSelectedAttendance(attendance);
    setShowAttendanceModal(true);
  };

  const handleCloseAttendanceModal = async () => {
    await fetchAllAttendances().catch((error) => console.error('Failed to refresh attendances:', error));
    setShowAttendanceModal(false);
    setSelectedAttendance(null);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredAttendances.map((attendance) => ({
      'Employee Name': attendance.employeeName || 'N/A',
      'Date': attendance.date || 'N/A',
      'Check In': attendance.inTime || 'N/A',
      'Check Out': attendance.outTime || 'N/A',
      'Status': getStatusText(attendance.status).text,
      'Approval Status': getApprovalStatusText(attendance.approvalStatus).text,
      'Department': attendance.department || 'N/A',
      'Branch': attendance.branchName || 'N/A',
      'Shift': getShiftDetails(attendance.shiftId),
      'Work Hours': formatWorkHours(attendance.workHours),
      'Late Minutes': formatMinutes(attendance.lateMinutes),
      'Overtime Hours': formatWorkHours(attendance.overtimeHours),
      'Early Leave Minutes': formatMinutes(attendance.earlyLeaveMinutes),
      'In Location': locationNames[`${attendance.attendanceId}-in`] || 'N/A',
      'Out Location': locationNames[`${attendance.attendanceId}-out`] || 'N/A',
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendances');
    XLSX.writeFile(workbook, 'attendances.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Attendance Records', 14, 20);
    doc.autoTable({
      startY: 30,
      head: [['Employee Name', 'Date', 'Check In', 'Check Out', 'Status', 'Approval Status', 'Department', 'Branch', 'Shift', 'Work Hours', 'Late Minutes', 'Overtime Hours', 'Early Leave Minutes', 'In Location', 'Out Location']],
      body: filteredAttendances.map((attendance) => [
        attendance.employeeName || 'N/A',
        attendance.date || 'N/A',
        attendance.inTime || 'N/A',
        attendance.outTime || 'N/A',
        getStatusText(attendance.status).text,
        getApprovalStatusText(attendance.approvalStatus).text,
        attendance.department || 'N/A',
        attendance.branchName || 'N/A',
        getShiftDetails(attendance.shiftId),
        formatWorkHours(attendance.workHours),
        formatMinutes(attendance.lateMinutes),
        formatWorkHours(attendance.overtimeHours),
        formatMinutes(attendance.earlyLeaveMinutes),
        locationNames[`${attendance.attendanceId}-in`] || 'N/A',
        locationNames[`${attendance.attendanceId}-out`] || 'N/A',
      ]),
    });
    doc.save('attendances.pdf');
  };

  return (
    <div className="attendance-page-container">
      <div className="header-section">
        <h2>Attendance Management</h2>
        <div>
          <button className="export-btn" onClick={exportToExcel}>Export to Excel</button>
          <button className="export-btn" onClick={exportToPDF}>Export to PDF</button>
          <button className="add-btn" onClick={() => handleManageAttendance(null)}>Add Attendance</button>
        </div>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      {isFetching && <div className="loading-message">Loading attendances...</div>}

      {showAttendanceModal && (
        <AttendanceForm
          attendance={selectedAttendance}
          onClose={handleCloseAttendanceModal}
        />
      )}

      <div className="table-section">
        <div className="filter-section">
          <input
            type="text"
            placeholder="Search by employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
          />
          <input
            type="text"
            placeholder="Filter by Department..."
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="filter-input"
          />
          <input
            type="date"
            placeholder="Filter by Date..."
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="table-wrapper">
          <table className="attendance-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}></th>
                <th>Employee Name</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
                <th>Approval Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentAttendances.length > 0 ? (
                currentAttendances.map((attendance) => {
                  const status = getStatusText(attendance.status);
                  const approvalStatus = getApprovalStatusText(attendance.approvalStatus);
                  return (
                    <React.Fragment key={attendance.attendanceId}>
                      <tr>
                        <td>
                          <button
                            className="action-btn details-btn"
                            onClick={() => toggleRow(attendance.attendanceId)}
                            title={expandedRows[attendance.attendanceId] ? 'Hide Details' : 'View Details'}
                          >
                            {expandedRows[attendance.attendanceId] ? <FaMinus /> : <FaPlus />}
                          </button>
                        </td>
                        <td>{attendance.employeeName || 'N/A'}</td>
                        <td>{attendance.date || 'N/A'}</td>
                        <td>{attendance.inTime || 'N/A'}</td>
                        <td>{attendance.outTime || 'N/A'}</td>
                        <td>
                          <span className={`status-badge ${status.class}`}>{status.text}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${approvalStatus.class}`}>{approvalStatus.text}</span>
                        </td>
                        <td className="actions-cell">
                          <button
                            className="action-btn manage-btn"
                            onClick={() => handleManageAttendance(attendance)}
                            title="Manage"
                          >
                            <FaEdit />
                          </button>
                        </td>
                      </tr>
                      {expandedRows[attendance.attendanceId] && (
                        <tr className="details-row">
                          <td colSpan="8">
                            <div className="details-content">
                              <p><strong>Shift:</strong> {getShiftDetails(attendance.shiftId)}</p>
                              <p><strong>Work Hours:</strong> {formatWorkHours(attendance.workHours)}</p>
                              <p><strong>Late Minutes:</strong> {formatMinutes(attendance.lateMinutes)}</p>
                              <p><strong>Overtime Hours:</strong> {formatWorkHours(attendance.overtimeHours)}</p>
                              <p><strong>Early Leave Minutes:</strong> {formatMinutes(attendance.earlyLeaveMinutes)}</p>
                              <p><strong>In Location:</strong> {locationNames[`${attendance.attendanceId}-in`] || 'Loading...'}</p>
                              <p><strong>Out Location:</strong> {locationNames[`${attendance.attendanceId}-out`] || 'Loading...'}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8">No attendances found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <button className="nav-btn" onClick={handlePrevPage} disabled={currentPage === 1}>
            Prev
          </button>
          <button className="nav-btn" onClick={handleNextPage} disabled={currentPage === totalPages}>
            Next
          </button>
          <span>Page {currentPage} of {totalPages || 1}</span>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
