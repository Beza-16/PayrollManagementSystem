import React, { useState, useEffect } from 'react';
import { useAttendanceSlice } from '../slices/attendancesSlice';
import '../styles/AttendanceForm.css';

const useAuth = () => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId') || (token ? JSON.parse(atob(token.split('.')[1])).sub : null);
  return { userId, isAuthenticated: !!token };
};

const AttendanceForm = ({ attendance, onClose }) => {
  const { handleAction, fetchAllEmployees, fetchAllShifts, employees, shifts } = useAttendanceSlice();
  const { userId } = useAuth();
  const [formData, setFormData] = useState({
    attendanceId: attendance?.attendanceId || '',
    employeeId: attendance?.employeeId || '',
    shiftId: attendance?.shiftId || '',
    inTime: attendance?.inTime || '',
    outTime: attendance?.outTime || '',
    status: attendance?.status?.toString() || '1',
    approvalStatus: attendance?.approvalStatus?.toString() || '0',
    notes: attendance?.notes || '',
    date: attendance?.date || new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchAllEmployees();
    fetchAllShifts();
    setFormData({
      attendanceId: attendance?.attendanceId || '',
      employeeId: attendance?.employeeId || '',
      shiftId: attendance?.shiftId || '',
      inTime: attendance?.inTime || '',
      outTime: attendance?.outTime || '',
      status: attendance?.status?.toString() || '1',
      approvalStatus: attendance?.approvalStatus?.toString() || '0',
      notes: attendance?.notes || '',
      date: attendance?.date || new Date().toISOString().split('T')[0],
    });
  }, [attendance, fetchAllEmployees, fetchAllShifts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        attendanceId: formData.attendanceId || undefined,
        employeeId: formData.employeeId,
        shiftId: formData.shiftId || undefined,
        inTime: formData.inTime,
        outTime: formData.outTime || undefined,
        status: parseInt(formData.status),
        approvalStatus: parseInt(formData.approvalStatus),
        notes: formData.notes.trim() || undefined,
        date: formData.date,
      };
      console.log('Sending payload:', payload);
      await handleAction(payload, !!formData.attendanceId);
      onClose();
    } catch (error) {
      console.error('Action failed:', error.response?.data || error);
    }
  };

  return (
    <div className="attendance-form-overlay">
      <div className="attendance-form-container">
        <h2>{formData.attendanceId ? 'Manage Attendance' : 'Add Attendance'}</h2>
        <form onSubmit={handleSubmit} className="attendance-form">
          <div className="form-group">
            <label>Employee</label>
            <select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              required
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.employeeId} value={employee.employeeId}>
                  {employee.fullName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Shift</label>
            <select
              name="shiftId"
              value={formData.shiftId}
              onChange={handleChange}
            >
              <option value="">Select Shift (Optional)</option>
              {shifts.map((shift) => (
                <option key={shift.shiftId} value={shift.shiftId}>
                  {shift.name} ({shift.startTime} - {shift.endTime})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Check In Time</label>
            <input
              type="time"
              name="inTime"
              value={formData.inTime}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Check Out Time</label>
            <input
              type="time"
              name="outTime"
              value={formData.outTime}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="0">Absent</option>
              <option value="1">Present</option>
              <option value="4">Half-day</option>
            </select>
          </div>
          <div className="form-group">
            <label>Approval Status</label>
            <select
              name="approvalStatus"
              value={formData.approvalStatus}
              onChange={handleChange}
              required
            >
              <option value="0">Pending</option>
              <option value="1">Approved</option>
              <option value="2">Rejected</option>
            </select>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              maxLength={1000}
              placeholder="Enter notes"
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={!formData.employeeId || !formData.date || !formData.inTime}
            >
              {formData.attendanceId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceForm;