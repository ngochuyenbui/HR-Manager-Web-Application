import React, { useEffect, useState, useMemo } from "react";
import axios from "axios"; // 1. Import axios
import CEmployeeTable from "../components/Table/CEmployeeTable";
import AddEmployeeModal from '../components/AddEmployeeModal';
// import HeaderTabs from '../components/HeaderTabs';
import FiltersBar from '../components/FiltersBar';

function EmployeeManagement() {
  const [activeTab, setActiveTab] = useState('fulltime');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ office: '', department: '', position: '', gender: '', type: '', status: '' });
  
  // 2. Khởi tạo data là mảng rỗng ban đầu (thay vì mock data)
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // derive unique positions from fetched data for filter options
  const positions = useMemo(() => {
    if (!data || data.length === 0) return [];
    const set = new Set();
    data.forEach((d) => {
      if (d.position) set.add(d.position);
    });
    return Array.from(set);
  }, [data]);

  const genders = useMemo(() => {
    if (!data || data.length === 0) return [];
    const set = new Set();
    data.forEach((d) => {
      if (d.sex) set.add(d.sex);
    });
    return Array.from(set);
  }, [data]);

  const types = useMemo(() => {
    if (!data || data.length === 0) return [];
    const set = new Set();
    data.forEach((d) => {
      if (d.type) set.add(d.type);
    });
    return Array.from(set);
  }, [data]);

  const statuses = useMemo(() => {
    if (!data || data.length === 0) return [];
    const set = new Set();
    data.forEach((d) => {
      if (d.status) set.add(d.status);
    });
    return Array.from(set);
  }, [data]);

  // 3. Fetch function (used on mount and after create)
  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/employees');
      const apiData = response.data;

      // 4. MAPPING DỮ LIỆU (ĐÃ SỬA LỖI)
      const formattedData = apiData.map(emp => {
        // Xử lý an toàn: Nếu không có chức vụ thì để chuỗi rỗng
        const safePosition = emp.position || ''; 
        
        return {
          id: emp.id,
          // Ghép họ tên
          fullName: `${emp.fName} ${emp.mName ? emp.mName + ' ' : ''}${emp.lName}`,
          email: emp.email,
          phone: emp.phone,
          sex: emp.sex,
          // Nếu không có position thì hiện 'Staff' mặc định
          position: safePosition || 'Staff', 
          type: emp.type, // Lưu ý: Backend bạn trả về 'type', không phải 'ceType' (check lại console log nếu cần)
          status: emp.status,
          // Xử lý địa chỉ an toàn
          location: emp.address ? emp.address.split(',').pop().trim() : 'Unknown',
          // SỬA LỖI CHÍNH TẠI ĐÂY: Kiểm tra safePosition thay vì emp.position
          department: safePosition.includes('HR') ? 'Human Resources' : 'Engineering'
        };
      });

      setData(formattedData);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi tải danh sách nhân viên:", error);
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const onFilterChange = (k, v) => setFilters((s) => ({ ...s, [k]: v }));
  const onClear = () => { setSearch(''); setFilters({ office: '', department: '', position: '', gender: '', type: '', status: '' }); };

  // State for add-contract modal
  const [addContractOpen, setAddContractOpen] = useState(false);
  const [contractEmployee, setContractEmployee] = useState(null);
  const [onContractAddedCallback, setOnContractAddedCallback] = useState(null);

  const handleOpenAddContract = (employee, callback) => {
    setContractEmployee(employee);
    setAddContractOpen(true);
    // Store callback to be called after contract is added
    setOnContractAddedCallback(() => callback);
  };

  const filteredData = useMemo(() => {
    return data.filter(emp => {
      const searchLower = (search || '').toLowerCase();
      const safeFull = (emp.fullName || '').toLowerCase();
      const safeEmail = (emp.email || '').toLowerCase();
      const matchSearch = (safeFull.includes(searchLower)) || (safeEmail.includes(searchLower));

      // department / office matching (case-insensitive)
      const matchDept = filters.department ? ((emp.department || '').toLowerCase() === (filters.department || '').toLowerCase()) : true;
      const matchOffice = filters.office ? ((emp.location || '').toLowerCase().includes((filters.office || '').toLowerCase())) : true;

      // new filters: position, gender (sex), type, status
      const matchPosition = filters.position ? ((emp.position || '').toLowerCase().trim() === (filters.position || '').toLowerCase().trim()) : true;
      const matchGender = filters.gender ? ((emp.sex || '').toLowerCase().trim() === (filters.gender || '').toLowerCase().trim()) : true;
      const matchType = filters.type ? ((emp.type || '').toLowerCase().trim() === (filters.type || '').toLowerCase().trim()) : true;
      const matchStatus = filters.status ? ((emp.status || '').toLowerCase().trim() === (filters.status || '').toLowerCase().trim()) : true;

      // Filter by activeTab
      const matchTab = activeTab === 'fulltime' ? (emp.type || '').toLowerCase() === 'fulltime' : (emp.type || '').toLowerCase() === 'freelance';

      return matchSearch && matchDept && matchOffice && matchPosition && matchGender && matchType && matchStatus && matchTab;
    });
  }, [data, search, filters, activeTab]);

  if (loading) {
    return <div className="p-10 text-center">Đang tải dữ liệu từ Server...</div>;
  }

  return (
    <div>
      {/* <HeaderTabs active={activeTab} onTabChange={setActiveTab} /> */}
      <div className="flex justify-end">
        
      </div>
      <FiltersBar 
        search={search} 
        onSearch={setSearch} 
        filters={filters} 
        onFilterChange={onFilterChange} 
        onClear={onClear} 
        positions={positions} 
        genders={genders} 
        types={types} 
        statuses={statuses}
        onAddSuccess={fetchEmployees}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CEmployeeTable data={filteredData} search={search} filters={filters} onAddContract={handleOpenAddContract} activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      <AddEmployeeModal
        isOpen={addContractOpen}
        onClose={() => setAddContractOpen(false)}
        initialData={contractEmployee}
        startStep={3}
        onSuccess={() => {
          setAddContractOpen(false);
          // refresh list
          fetchEmployees();
          // Call the callback if provided (for reactivating employee)
          if (onContractAddedCallback) {
            onContractAddedCallback();
            setOnContractAddedCallback(null);
          }
        }}
      />
    </div>
  );
}

export default EmployeeManagement;