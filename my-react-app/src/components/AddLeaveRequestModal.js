import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function AddLeaveRequestModal({ isOpen, onClose, onSuccess }) {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'Sick',
    reason: '',
    employeeId: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load employees on mount
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/employees');
        if (res.ok) {
          const data = await res.json();
          console.log('Employees API response:', data);
          // Filter only full-time employees
          const fullTimeEmployees = data.filter(emp => 
            emp.type === 'Fulltime' || emp.contractType === 'Fulltime'
          );
          console.log('Filtered fulltime employees:', fullTimeEmployees);
          setEmployees(fullTimeEmployees);
        }
      } catch (err) {
        console.error('Failed to load employees:', err);
      }
    };

    if (isOpen) {
      loadEmployees();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validate = () => {
    if (!formData.employeeId) {
      setError('Employee is required');
      return false;
    }
    if (!formData.startDate) {
      setError('Start date is required');
      return false;
    }
    if (!formData.endDate) {
      setError('End date is required');
      return false;
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('Start date must be before end date');
      return false;
    }
    if (!formData.leaveType) {
      setError('Leave type is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      setLoading(true);
      
      const payload = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        leaveType: formData.leaveType,
        reason: formData.reason,
        employeeCreate: parseInt(formData.employeeId)
      };

      const res = await fetch('http://localhost:5000/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create leave request');
      }

      setFormData({ startDate: '', endDate: '', leaveType: 'Sick', reason: '', employeeId: '' });
      setError('');
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Error creating leave request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold">Create leave request</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Employee Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee name <span className="text-red-500">*</span>
            </label>
            <select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900"
              required
            >
              <option value="" className="text-gray-500">Select an employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id} className="text-gray-900">
                  {emp.fullName || emp.fName + ' ' + emp.lName || emp.name || `Employee ${emp.id}`}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave type <span className="text-red-500">*</span>
            </label>
            <select
              name="leaveType"
              value={formData.leaveType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="Sick">Sick Leave</option>
              <option value="Annual">Annual Leave</option>
              <option value="PTO">PTO (Paid Time Off)</option>
              <option value="Unpaid">Unpaid Leave</option>
              <option value="Vacation">Vacation</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="Enter reason for leave..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
