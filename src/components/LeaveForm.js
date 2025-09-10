import React, { useState, useEffect } from 'react';
import { useLeaveSlice } from '../slices/LeaveSlice';
import '../styles/LeaveForm.css';

// Simulated auth context or hook (replace with your actual auth solution)
const useAuth = () => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId') || (token ? JSON.parse(atob(token.split('.')[1])).sub : null); // Extract from token if available
  return { userId, isAuthenticated: !!token };
};

const LeaveForm = ({ leave, onClose }) => {
  const { handleAction } = useLeaveSlice();
  const { userId } = useAuth(); // Kept for potential future use, but not sent
  const [formData, setFormData] = useState({
    LeaveID: leave?.LeaveID || '',
    Status: leave?.Status?.toString() || '0',
    RejectionReason: leave?.RejectionReason || '',
  });

  useEffect(() => {
    setFormData({
      LeaveID: leave?.LeaveID || '',
      Status: leave?.Status?.toString() || '0',
      RejectionReason: leave?.RejectionReason || '',
    });
  }, [leave]);

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
        LeaveID: formData.LeaveID,
        Status: parseInt(formData.Status),
        RejectionReason: formData.Status === '2' ? formData.RejectionReason.trim() : null,
      };
      console.log('Sending payload:', payload);
      await handleAction(payload);
      onClose();
    } catch (error) {
      console.error('Action failed:', error.response?.data || error);
    }
  };

  return (
    <div className="leave-form-overlay">
      <div className="leave-form-container">
        <h2>Manage Leave Request</h2>
        <form onSubmit={handleSubmit} className="leave-form">
          <div className="form-group">
            <label>Employee Name</label>
            <input type="text" value={leave?.EmployeeName || 'N/A'} disabled />
          </div>
          <div className="form-group">
            <label>Action</label>
            <select name="Status" value={formData.Status} onChange={handleChange} required>
              <option value="0">Pending</option>
              <option value="1">Approve</option>
              <option value="2">Reject</option>
            </select>
          </div>
          {formData.Status === '2' && (
            <div className="form-group">
              <label>Rejection Reason</label>
              <textarea
                name="RejectionReason"
                value={formData.RejectionReason}
                onChange={handleChange}
                maxLength={1000}
                placeholder="Enter rejection reason"
              />
            </div>
          )}
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={!formData.Status || (formData.Status === '2' && !formData.RejectionReason.trim())}>
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveForm;