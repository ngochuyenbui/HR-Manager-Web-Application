import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit2, ChevronLeft, Briefcase, X, Calendar } from "lucide-react";
import axios from "axios";
import CustomScrollbar from "../schollbar";

export default function ProfileDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [payslipHistory, setPayslipHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/employees/${id}/profile`);
        setEmployeeData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi tải profile:", err);
        setError("Không tìm thấy nhân viên hoặc lỗi server.");
        setLoading(false);
      }
    };

    if (id) {
      fetchProfile();
    }
  }, [id]);

  const handleEditClick = () => {
    if (employeeData?.info) {
      setEditFormData({
        Name: employeeData.info.Name || '',
        Phone: employeeData.info.Phone || '',
        Email: employeeData.info.Email || '',
        Address: employeeData.info.Address || '',
        Position: employeeData.info.Position || '',
      });
      setShowEditModal(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async () => {
    try {
      console.log("Sending update:", editFormData);

      const response = await axios.put(
        `http://localhost:5000/api/employees/${id}`,
        editFormData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Update response:", response.data);

      const refreshResponse = await axios.get(`http://localhost:5000/api/employees/${id}/profile`);
      setEmployeeData(refreshResponse.data);

      setShowEditModal(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error("Error updating profile:", err);
      console.error("Error details:", err.response?.data);

      let errorMsg = 'Failed to update profile. ';
      if (err.response) {
        errorMsg += `Server error: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`;
      } else if (err.request) {
        errorMsg += 'No response from server. Please check if the backend is running.';
      } else {
        errorMsg += err.message;
      }

      alert(errorMsg);
    }
  };

  // Hàm xử lý hiển thị lịch sử lương
  const handleShowHistory = async () => {
    setShowHistoryModal(true); // Mở modal ngay
    setLoadingHistory(true);   // Hiện loading
    try {
      // Gọi API Backend để lấy lịch sử lương
      const response = await axios.get(`http://localhost:5000/api/employees/${id}/payslip-history`);
      setPayslipHistory(response.data);
    } catch (err) {
      console.error("Lỗi lấy lịch sử lương:", err);
      // alert("Không thể tải lịch sử lương"); // Có thể bỏ alert nếu muốn UX mượt hơn
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!employeeData) return null;

  const { info, contracts, payslips } = employeeData;
  const latestPayslip = payslips && payslips.length > 0 ? payslips[0] : null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6 scroll-smooth">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-full" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold">{info.Name}</h2>
              <p className="text-sm text-gray-500">{info.Position}</p>
            </div>
          </div>

          <span className={`text-xs font-medium px-3 py-1 rounded-full 
            ${info.Position === 'Fulltime'
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700'
            }`}>
            {info.Position}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left Content */}
        <div className="col-span-12 space-y-6">

          {/* General Info */}
          <section id="general-info" className="bg-white rounded-2xl shadow p-6 scroll-mt-24">
            <SectionHeader title="General Information" content="Edit" onEdit={handleEditClick} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SubSection title="Personal Information">
                <InfoGrid data={{ "Employee ID": info.ID, Phone: info.Phone, Email: info.Email, Sex: info.Sex }} cols={1} />
              </SubSection>
              <div className="space-y-6">
                <SubSection title="Address Information">
                  <InfoGrid data={{ Address: info.Address }} cols={1} />
                </SubSection>
                <SubSection title="Employment Information">
                  <InfoGrid data={{ "Job Title": info.Position }} cols={1} />
                </SubSection>
              </div>
            </div>
          </section>

          {/* Contract Section */}
          <section id="contract-section" className="bg-white rounded-2xl shadow p-6 scroll-mt-24">
            <SectionHeader title="Contract" showEdit={false} />

            {contracts && contracts.length > 0 ? (
              <>
                {contracts.length > 2 ? (
                  <div className="h-[450px]">
                    <CustomScrollbar>
                      <div className="space-y-4 pr-4 pb-2">
                        {contracts.map((contract) => (
                          <ContractItem key={contract.FullCon_ID} contract={contract} />
                        ))}
                      </div>
                    </CustomScrollbar>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contracts.map((contract) => (
                      <ContractItem key={contract.FullCon_ID} contract={contract} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-500 italic text-center py-4">No contract data available</p>
            )}
          </section>

          {/* Payslip Section */}
          <section id="payslip-section" className="bg-white rounded-2xl shadow p-6 scroll-mt-24">
            <SectionHeader title="Payslip" showEdit={true} content={"Show History"} onEdit={handleShowHistory} />
            {latestPayslip ? (
              <SubSection title="Latest Earning">
                <InfoGrid data={{ 
                  "Month/Year": latestPayslip.monthYear || `${latestPayslip.month}/${latestPayslip.year}`, 
                  "Net Pay": latestPayslip.netPay ?`${Number(latestPayslip.netPay).toLocaleString()} VND` : '0 VND' 
                }} />
              </SubSection>
            ) : <div>No payslip data</div>}
          </section>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-800">Edit Employee Information</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Full Name</label>
                      <input
                        type="text"
                        name="Name"
                        value={editFormData.Name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Phone</label>
                      <input
                        type="text"
                        name="Phone"
                        value={editFormData.Phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        name="Email"
                        value={editFormData.Email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">Address</label>
                      <input
                        type="text"
                        name="Address"
                        value={editFormData.Address}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Employment Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase mb-3">Employment Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Position</label>
                      <select
                        name="Position"
                        value={editFormData.Position}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Fulltime">Fulltime</option>
                        <option value="Freelance">Freelance</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50 flex-shrink-0">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-orange-500" />
                Payslip History
              </h2>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-gray-200 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-0 overflow-y-auto max-h-[60vh]">
              {loadingHistory ? (
                <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
              ) : payslipHistory.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {payslipHistory.map((item, index) => (
                    <div key={index} className="p-4 hover:bg-orange-50 transition-colors flex justify-between items-center group">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Tháng {item.month}/{item.year}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {item.status || 'Paid'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800 flex items-center justify-end gap-1">
                          {item.netPay ? Number(item.netPay).toLocaleString() : 0} <span className="text-xs text-gray-500">VND</span>
                        </p>
                        <p className="text-xs text-green-600 font-medium">Thực lãnh</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 italic">
                  <p>Chưa có lịch sử lương nào.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t bg-gray-50 text-center">
              <button onClick={() => setShowHistoryModal(false)} className="text-sm text-gray-500 hover:text-gray-800 font-medium">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- COMPONENT DEFINITIONS ---

function ContractItem({ contract }) {
  return (
    <div className={`border rounded-xl p-4 transition-colors ${contract.Status === 'Active' ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100 opacity-80'}`}>
      <div className="flex justify-between items-start mb-4 border-b border-gray-200/50 pb-2">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-green-600" />
          <span className="font-semibold text-gray-700">
            {contract.Type} <span className="text-xs text-gray-500">#{contract.FullCon_ID}</span>
          </span>
        </div>
        <span className="text-xs font-bold bg-green-200 text-green-800 px-2 py-1 rounded">
          {contract.Status}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SubSection title="Duration" className="mb-0">
          <InfoGrid data={{ "Start Date": contract.StartDate, "End Date": contract.EndDate || "Indefinite" }} />
        </SubSection>
        <SubSection title="Compensation" className="mb-0">
          <InfoGrid data={{ "Base Salary": contract.BaseSalary ? `${Number(contract.BaseSalary).toLocaleString()} VND` : 'N/A' }} />
        </SubSection>
      </div>
    </div>
  );
}

function SectionHeader({ title, showEdit = true, content, onEdit }) {
  return (
    <div className="mb-4 border-b pb-2 font-bold flex justify-between">
      <h3>{title}</h3>
      {showEdit && (
        <button
          onClick={onEdit}
          className="text-sm text-orange-500 hover:text-orange-600 transition-colors"
        >
          <Edit2 className="w-4 h-4 inline" /> {content}
        </button>
      )}
    </div>
  );
}

function SubSection({ title, children, className = "" }) {
  return <div className={`mb-4 ${className}`}><h4 className="text-xs text-gray-500 uppercase mb-2">{title}</h4>{children}</div>
}

function InfoGrid({ data, cols = 2 }) {
  // If cols is 1, use 'grid-cols-1', otherwise use 'grid-cols-2'
  const gridClass = cols === 1 ? 'grid-cols-1' : 'grid-cols-2';

  return (
    <div className={`grid ${gridClass} gap-2 text-sm`}>
      {Object.entries(data).map(([k, v]) => (
        <div key={k}>
          <span className="text-gray-400 block">{k}</span>
          <span>{v || 'N/A'}</span>
        </div>
      ))}
    </div>
  );
}