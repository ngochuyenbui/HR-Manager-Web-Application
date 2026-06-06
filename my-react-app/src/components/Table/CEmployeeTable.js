import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import { createPortal } from 'react-dom';
import Pagination from '../pagination';
import NotificationModal from '../NotificationModal';

function CEmployeeTable({ 
  // SỬA LỖI 2: Nhận prop 'data' thay vì 'employees' để khớp với file cha
  data = [], 
  columns = null, 
  title = "Employee List",
  showActions = true,
  onEdit = null,
  onAddContract = null,
  activeTab = null,
  setActiveTab = null
}) {
  // Gán data vào biến employees để dùng tiếp logic bên dưới
  const employees = data;

  // SỬA LỖI 3: Cập nhật cấu hình cột khớp với tên biến trong MOCK DATA (fullName, email...)
  const defaultColumns = [
    { header: "ID", accessor: "id" },
    { header: "Full Name", accessor: "fullName" }, // Dùng accessor trực tiếp vì data đã nối chuỗi rồi
    { header: "Position", accessor: "position" },
    { header: "Email", accessor: "email" },
    { header: "Phone", accessor: "phone" },
    { 
      header: "Gender", 
      // Sửa logic render giới tính
      render: (row) => row.sex === 'M' ? 'Male' : row.sex === 'F' ? 'Female' : row.sex 
    },
    { 
      header: "Type", 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            // Sửa logic check màu dựa trên value thực tế
            row.type === "HR" ? "bg-purple-100 text-purple-700" : 
            row.type === "Freelance" ? "bg-orange-100 text-orange-700" : 
            "bg-blue-100 text-blue-700"
        }`}>
          {row.type}
        </span>
      )
    },
    {
      header: "Status",
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.status === "Active" ? "bg-green-100 text-green-700" : 
            row.status === "Inactive" ? "bg-red-100 text-red-700" : 
            "bg-gray-100 text-gray-700"
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  const tableColumns = columns || defaultColumns;

  // Pagination: allow parent to set default pageSize via prop later
  // For now, use internal client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Notification modal state
  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // State to track employee being reactivated (needs contract)
  const [reactivatingEmployee, setReactivatingEmployee] = useState(null);

  // State for permanent deletion confirmation
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    employeeId: null,
    employeeName: null
  });

  // Keep a local copy of employees so we can update an item's status in-place
  // without forcing a full page reload which may change ordering.
  const [localEmployees, setLocalEmployees] = useState(employees);

  // Reset local copy and pagination when the parent data changes
  // Keep Active employees first and Inactive ones at the bottom; within each group keep id order.
  useEffect(() => {
    const statusOrder = (s) => (s === 'Active' ? 0 : 1);
    const sorted = (employees || []).slice().sort((a, b) => {
      const sa = statusOrder(a.status);
      const sb = statusOrder(b.status);
      if (sa !== sb) return sa - sb;
      const ai = Number(a.id ?? 0);
      const bi = Number(b.id ?? 0);
      return ai - bi;
    });
    setLocalEmployees(sorted);
    setCurrentPage(1);
  }, [employees]);

  const totalPages = Math.max(1, Math.ceil((localEmployees || []).length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pagedEmployees = (localEmployees || []).slice(startIndex, endIndex);

  // Resolve API base: prefer REACT_APP_API_BASE, otherwise when running the dev server
  // on port 3000 assume backend is on localhost:5000. When built, REACT_APP_API_BASE
  // should be set or relative URLs will be used.
  const API_BASE = (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim()) ||
    (typeof window !== 'undefined' && window.location && window.location.port === '3000' ? 'http://localhost:5000' : '');

  const handleEdit = (item) => {
    if (onEdit) {
      onEdit(item);
    } else {
      window.location.href = `/employeemanagement/profile/${item.id}`;
    }
  };

  // Dropdown menu state
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setOpenMenuId(null);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpenMenuId(null);
    }
    if (openMenuId !== null) {
      document.addEventListener('click', onDocClick);
      document.addEventListener('keydown', onKey);
      return () => {
        document.removeEventListener('click', onDocClick);
        document.removeEventListener('keydown', onKey);
      };
    }
  }, [openMenuId]);

  const openMenu = (e, item) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX });
    setOpenMenuId(item.id);
  };

  const handleEditAction = (item) => {
    setOpenMenuId(null);
    handleEdit(item);
  };

  const handleEditForm = (item) => {
    setOpenMenuId(null);
    if (onAddContract) return onAddContract(item);
    if (onEdit) return onEdit(item);
    window.location.href = `/employeemanagement/edit/${item.id}`;
  };

  const handleDelete = async (item) => {
    // Toggle status instead of deleting
    const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    
    // If trying to activate an inactive employee, require adding a contract first
    if (item.status === 'Inactive' && newStatus === 'Active') {
      setNotification({
        isOpen: true,
        title: 'Add Contract Required',
        message: 'This employee is inactive. Please add a new contract before reactivating the employee.',
        type: 'info'
      });
      setOpenMenuId(null);
      // Open the contract modal if onAddContract is available
      if (onAddContract) {
        setReactivatingEmployee(item);
        // Pass callback to activate employee after contract is added
        onAddContract(item, () => activateEmployee(item.id));
      }
      return;
    }
    
    // If trying to inactivate, check if there are unpaid salaries
    if (newStatus === 'Inactive') {
      try {
        const checkUrl = `${API_BASE}/api/employees/${item.id}/has-unpaid-salary`;
        console.log('Checking unpaid salary at URL:', checkUrl, 'Employee ID:', item.id);
        const checkResp = await axios.get(checkUrl);
        
        if (checkResp.data.hasUnpaidSalary) {
          setNotification({
            isOpen: true,
            title: 'Cannot Inactivate Employee',
            message: `This employee has ${checkResp.data.unpaidCount} unpaid salary record(s). Please settle all salary payments first before inactivating.`,
            type: 'warning'
          });
          setOpenMenuId(null);
          return;
        }
      } catch (err) {
        console.error('Failed to check unpaid salary', err);
        console.log('Error details - Status:', err.response?.status, 'Data:', err.response?.data);
        // If there's an error checking, proceed with caution
        const errorMsg = err.response?.data?.message || err.message;
        setNotification({
          isOpen: true,
          title: 'Error',
          message: `Error checking salary status: ${errorMsg}`,
          type: 'error'
        });
        setOpenMenuId(null);
        return;
      }
    }
    
    const url = `${API_BASE}/api/employees/${item.id}/status`; // update only status
    const payload = { Status: newStatus, status: newStatus };
    try {
      console.log('Updating status for', item.id, 'to', newStatus, 'PUT', url, payload);
      const resp = await axios.put(url, payload, { headers: { 'Content-Type': 'application/json' } });
      console.log('Update response', resp && resp.data ? resp.data : resp.status);
      // close menu
      setOpenMenuId(null);
      // update local list in-place so the item's position remains the same
      setLocalEmployees(prev => {
        if (!prev) return prev;
        const updated = prev.map(emp => emp.id === item.id ? { ...emp, status: newStatus } : emp);
        // re-sort so Inactive move to bottom
        const statusOrder = (s) => (s === 'Active' ? 0 : 1);
        updated.sort((a, b) => {
          const sa = statusOrder(a.status);
          const sb = statusOrder(b.status);
          if (sa !== sb) return sa - sb;
          return Number(a.id ?? 0) - Number(b.id ?? 0);
        });
        return updated;
      });
      // Show success notification
      setNotification({
        isOpen: true,
        title: 'Success',
        message: `Employee status updated to ${newStatus} successfully.`,
        type: 'success'
      });
    } catch (err) {
      console.error('Failed to update status', err, err.response ? err.response.data : 'no response');
      const serverMsg = err.response && err.response.data ? JSON.stringify(err.response.data) : err.message;
      setNotification({
        isOpen: true,
        title: 'Error',
        message: `Failed to update status. Server error: ${serverMsg}`,
        type: 'error'
      });
    }
  };

  // Function to activate employee after contract is added
  const activateEmployee = async (employeeId) => {
    const url = `${API_BASE}/api/employees/${employeeId}/status`;
    const payload = { Status: 'Active', status: 'Active' };
    try {
      await axios.put(url, payload, { headers: { 'Content-Type': 'application/json' } });
      // update local list
      setLocalEmployees(prev => {
        if (!prev) return prev;
        const updated = prev.map(emp => emp.id === employeeId ? { ...emp, status: 'Active' } : emp);
        // re-sort so Active move to top
        const statusOrder = (s) => (s === 'Active' ? 0 : 1);
        updated.sort((a, b) => {
          const sa = statusOrder(a.status);
          const sb = statusOrder(b.status);
          if (sa !== sb) return sa - sb;
          return Number(a.id ?? 0) - Number(b.id ?? 0);
        });
        return updated;
      });
      setNotification({
        isOpen: true,
        title: 'Success',
        message: 'Employee has been reactivated successfully.',
        type: 'success'
      });
      setReactivatingEmployee(null);
    } catch (err) {
      console.error('Failed to activate employee', err);
      setNotification({
        isOpen: true,
        title: 'Error',
        message: 'Failed to activate employee. Please try again.',
        type: 'error'
      });
    }
  };

  // Function to permanently delete an employee
  const handleDeletePermanent = async (employeeId) => {
    const url = `${API_BASE}/api/employees/${employeeId}`;
    try {
      await axios.delete(url);
      // Remove employee from local list
      setLocalEmployees(prev => {
        if (!prev) return prev;
        return prev.filter(emp => emp.id !== employeeId);
      });
      setNotification({
        isOpen: true,
        title: 'Success',
        message: 'Employee has been permanently deleted.',
        type: 'success'
      });
      setDeleteConfirm({ isOpen: false, employeeId: null, employeeName: null });
    } catch (err) {
      console.error('Failed to delete employee', err);
      const serverMsg = err.response && err.response.data ? JSON.stringify(err.response.data) : err.message;
      setNotification({
        isOpen: true,
        title: 'Error',
        message: `Failed to delete employee. This employee may have associated records that prevent deletion.`,
        type: 'error'
      });
      setDeleteConfirm({ isOpen: false, employeeId: null, employeeName: null });
    }
  };

  return (
    <div className="flex justify-center mt-4">
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
      
      {/* Permanent Delete Confirmation Modal */}
      {deleteConfirm.isOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-2">Delete Employee Permanently?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to permanently delete <strong>{deleteConfirm.employeeName}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({ isOpen: false, employeeId: null, employeeName: null })}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePermanent(deleteConfirm.employeeId)}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        typeof document !== 'undefined' ? document.body : null
      )}
      <div className="w-full bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="bg-blue-600 text-white text-center py-4 font-semibold text-xl">
          {title}
        </div>

        {/* Tabs - only show if activeTab and setActiveTab are provided */}
        {activeTab !== null && setActiveTab !== null && (
          <div className="flex justify-center gap-0 border-b border-gray-200 px-4">
            <button
              onClick={() => setActiveTab("fulltime")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "fulltime"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Fulltime Employee
            </button>
            <button
              onClick={() => setActiveTab("freelance")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "freelance"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Freelance Employee
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                {tableColumns.map((col, index) => (
                  <th key={index} className="py-3 px-4 text-left font-semibold border-b text-sm">
                    {col.header}
                  </th>
                ))}
                {showActions && <th className="py-3 px-4 text-left font-semibold border-b text-sm">Action</th>}
              </tr>
            </thead>
            <tbody>
              {pagedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={tableColumns.length + (showActions ? 1 : 0)} className="py-8 text-center text-gray-400">
                    No data found
                  </td>
                </tr>
              ) : (
                pagedEmployees.map((item, rowIndex) => (
                  <tr key={item.id || startIndex + rowIndex} className={`${(startIndex + rowIndex) % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition`}>
                    {tableColumns.map((col, colIndex) => (
                      <td key={colIndex} className="py-3 px-4 text-left border-b text-sm">
                        {/* Logic render an toàn */}
                        {col.render ? col.render(item) : item[col.accessor]}
                      </td>
                    ))}
                    {showActions && (
                      <td className="py-3 px-4 text-left border-b text-sm">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => openMenu(e, item)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-blue-600"
                            aria-haspopup="menu"
                            aria-expanded={openMenuId === item.id}
                            aria-label={`Actions for ${item.fullName || item.id}`}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                              <circle cx="12" cy="6" r="1.5" />
                              <circle cx="12" cy="12" r="1.5" />
                              <circle cx="12" cy="18" r="1.5" />
                            </svg>
                          </button>

                          {openMenuId === item.id && createPortal(
                            <div
                              ref={menuRef}
                              role="menu"
                              aria-label="Row actions"
                              className="bg-white border rounded shadow-lg z-50 py-1"
                              style={{ position: 'absolute', top: menuPos.top + 'px', left: menuPos.left + 'px', minWidth: 120 }}
                            >
                              <button onClick={() => handleEditAction(item)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100">Employee Detail</button>
                              {/* <button onClick={() => handleEditForm(item)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100">Add new contract</button> */}
                              <button
                                onClick={() => handleDelete(item)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${item.status === 'Active' ? 'text-orange-600' : 'text-green-600'}`}
                              >
                                {item.status === 'Active' ? 'Inactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirm({ isOpen: true, employeeId: item.id, employeeName: item.fullName })}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600"
                              >
                                Delete Permanently
                              </button>

                            </div>,
                            typeof document !== 'undefined' ? document.body : null
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {employees.length > 0 && (
          <Pagination
            totalItems={employees.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
            pageSizeOptions={[5,10,20,50]}
            showRange={true}
          />
        )}
      </div>
    </div>
  );
}

export default CEmployeeTable;