import React, { useState, useRef, useEffect } from "react";
import { createPortal } from 'react-dom';
import axios from 'axios';
import NotificationModal from '../NotificationModal';

function FreelanceContractTable({
  data = [],
  columns = null,
  title = "Freelance Contract List",
  showActions = true,
  onEdit = null,
  onContractEnded = null
}) {
  const contracts = data;
  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [endConfirm, setEndConfirm] = useState({
    isOpen: false,
    contractId: null,
    employeeId: null,
    contractName: null
  });
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // CỘT MẶC ĐỊNH CHO FREELANCE CONTRACT (giống style FullTime)
  const defaultColumns = [
    { header: "Contract ID", accessor: "contractId" },
    { header: "Employee ID", accessor: "employeeId" },
    { header: "Start Date", accessor: "startDate" },
    { 
      header: "End Date",
      render: (row) => {
        if (row.endDate) {
          return <span style={{ color: '#b91c1c', fontWeight: '500' }}>{row.endDate}</span>;
        } else {
          return <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: '500' }}>Ongoing</span>;
        }
      }
    },

    {
      header: "Value",
      render: (row) => `${Number(row.value || 0).toLocaleString()} VND`
    },
    {
      header: "Committed Deadline",
      accessor: "committedDeadline"
    },
    {
      header: "Status",
      render: (row) => {
        const cls = row.status === "Active"
          ? "bg-green-100 text-green-700"
          : row.status === "Expired"
          ? "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-700";
        return (
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${cls}`}>
            {row.status}
          </span>
        );
      }
    }
  ];

  const tableColumns = columns || defaultColumns;

  const handleEdit = (item) => {
    if (onEdit) return onEdit(item);
    window.location.href = `/contracts/freelance/${item.contract_id}`;
  };

  const handleView = (item) => {
    handleEdit(item);
  };

  const handleEndContract = async (contractId, employeeId) => {
    const API_BASE = (process.env.REACT_APP_API_BASE && process.env.REACT_APP_API_BASE.trim()) ||
      (typeof window !== 'undefined' && window.location && window.location.port === '3000' ? 'http://localhost:5000' : '');
    
    try {
      // First, check if employee has unpaid payslips
      const checkPayslipsUrl = `${API_BASE}/api/freelance-contracts/${contractId}/employee/unpaid-payslips`;
      const payslipsResp = await axios.get(checkPayslipsUrl);
      
      if (payslipsResp.data.hasUnpaidPayslips) {
        setNotification({
          isOpen: true,
          title: 'Cannot End Contract',
          message: `This employee has ${payslipsResp.data.unpaidCount} unpaid payslip(s). Please settle all payments before ending the contract.`,
          type: 'warning'
        });
        setEndConfirm({ isOpen: false, contractId: null, employeeId: null, contractName: null });
        return;
      }
      
      // If no unpaid payslips, proceed to end contract
      const url = `${API_BASE}/api/freelance-contracts/${contractId}/end`;
      const payload = { endDate: new Date().toISOString().split('T')[0] }; // Today's date
      const resp = await axios.put(url, payload, { headers: { 'Content-Type': 'application/json' } });
      
      // After contract is ended, update employee status based on remaining active contracts
      await axios.post(`${API_BASE}/api/employees/${employeeId}/update-status-from-contracts`);
      
      setNotification({
        isOpen: true,
        title: 'Success',
        message: `Contract has been ended. Employee status has been updated based on active contracts.`,
        type: 'success'
      });
      
      // Callback to parent to refresh data
      if (onContractEnded) {
        onContractEnded(contractId, employeeId);
      }
      
      setEndConfirm({ isOpen: false, contractId: null, employeeId: null, contractName: null });
    } catch (err) {
      console.error('Failed to end contract', err);
      let errorMsg = err.message;
      
      // Check if server returned a specific error message
      if (err.response && err.response.data) {
        if (err.response.data.message) {
          errorMsg = err.response.data.message;
        } else if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        }
      }
      
      setNotification({
        isOpen: true,
        title: 'Error',
        message: errorMsg,
        type: 'error'
      });
      setEndConfirm({ isOpen: false, contractId: null, employeeId: null, contractName: null });
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
      
      {/* End Contract Confirmation Modal */}
      {endConfirm.isOpen && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-orange-600 mb-2">End Contract Early?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to end <strong>{endConfirm.contractName}</strong> today? This will set the contract end date to today's date.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEndConfirm({ isOpen: false, contractId: null, employeeId: null, contractName: null })}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEndContract(endConfirm.contractId, endConfirm.employeeId)}
                className="px-4 py-2 text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
              >
                End Contract
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
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={tableColumns.length + (showActions ? 1 : 0)} className="py-8 text-center text-gray-400">
                    No contracts found
                  </td>
                </tr>
              ) : (
                contracts.map((item, rowIndex) => (
                  <tr key={item.contract_id || rowIndex} className={`${rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition`}>
                    {tableColumns.map((col, colIndex) => (
                      <td key={colIndex} className="py-3 px-4 text-left border-b text-sm">
                        {col.render ? col.render(item) : item[col.accessor]}
                      </td>
                    ))}
                    
                    {showActions && (
                      <td className="py-3 px-4 text-left border-b text-sm relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === item.contractId ? null : item.contractId)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Actions"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </button>
                        
                        {openDropdown === item.contractId && (
                          <div 
                            ref={dropdownRef}
                            className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200"
                            style={{ top: '100%' }}
                          >
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleView(item);
                                  setOpenDropdown(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                View
                              </button>
                              {!item.endDate && (
                                <button
                                  onClick={() => {
                                    setEndConfirm({ 
                                      isOpen: true, 
                                      contractId: item.contractId, 
                                      employeeId: item.employeeId,
                                      contractName: `Contract #${item.contractId}`
                                    });
                                    setOpenDropdown(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  End Contract
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {contracts.length > 0 && (
          <div className="text-gray-500 text-sm text-right p-3 border-t">
            Showing {contracts.length} record{contracts.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

export default FreelanceContractTable;
