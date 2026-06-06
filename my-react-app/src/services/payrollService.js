import axios from 'axios';

// [UPDATED] Sử dụng Port 5000 theo yêu cầu của bạn
const API_URL = 'http://localhost:5000/api/payroll';

export const PayrollService = {
    
    // =================================================================
    // 1. DASHBOARD & METADATA
    // =================================================================
    
    // Lấy danh sách bảng lương (Hiển thị Dashboard)
    getPayrollList: async (month, year) => {
        try {
            const response = await axios.get(`${API_URL}`, {
                params: { month, year }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching payroll list:", error);
            return [];
        }
    },

    // Lấy danh sách loại thưởng (Metadata cho Dropdown trong Popup Edit)
    getBonusMetadata: async () => {
        try {
            const response = await axios.get(`${API_URL}/metadata/bonus-types`);
            return response.data; // [{key: 'holiday', label: 'Holiday Bonus'}, ...]
        } catch (error) {
            console.error("Error fetching metadata:", error);
            return [];
        }
    },

    getFreelanceTerms: async (employeeId, month, year) => {
        try {
            const response = await axios.get(`${API_URL}/freelance-contract-terms`, {
                params: { employeeId, month, year }
            });
            return response.data; // { bonuses: [], penalties: [] }
        } catch (error) {
            console.error("Error fetching freelance terms:", error);
            return { bonuses: [], penalties: [] };
        }
    },

    // [NEW] Lấy tóm tắt công/OT từ Timesheet (Read-only từ hệ thống chấm công)
    getTimesheetSummary: async (employeeId, month, year) => {
        try {
            const response = await axios.get(`${API_URL}/timesheet-summary`, {
                params: { employeeId, month, year }
            });
            // Trả về: { actualWorkDays: 21.5, suggestedOtHours: 5.0 }
            return response.data; 
        } catch (error) {
            console.error("Error fetching timesheet summary:", error);
            return { actualWorkDays: 0, suggestedOtHours: 0 };
        }
    },

    // =================================================================
    // 2. TÍNH TOÁN (CALCULATION CORE)
    // =================================================================

    /**
     * TÍNH TẤT CẢ (CALCULATE ALL) - Bulk
     */
    calculateAll: async (month, year) => {
        try {
            const payload = {
                month: parseInt(month),
                year: parseInt(year),
                employeeInputs: [] // Rỗng -> Backend tự quét toàn bộ nhân viên Active
            };
            
            const response = await axios.post(`${API_URL}/calculate`, payload);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "Lỗi kết nối server" };
        }
    },

    /**
     * TÍNH LẠI 1 NGƯỜI (RE-CALCULATE) - Single
     * Hàm này tự động điều hướng:
     * - Fulltime: Gọi API riêng trả về DTO chi tiết ngay lập tức.
     * - Freelance: Gọi API chung (Bulk).
     */
    recalculateSingle: async (params) => {
        try {
            // CASE 1: FULLTIME (Dùng endpoint mới chuyên biệt)
            if (params.type === 'Fulltime') {
                const payload = {
                    payrollId: params.payrollId, // Có thể null nếu chưa tạo kỳ lương
                    employeeId: params.employeeId,
                    month: parseInt(params.month),
                    year: parseInt(params.year),
                    // Backend sẽ ưu tiên lấy từ Timesheet, nhưng vẫn gửi lên cho đúng DTO
                    actualWorkDays: params.actualWorkDays, 
                    otHours: params.otHours,
                    bonuses: params.manualBonuses || {},
                    manualPenalties: params.manualPenalties || {}
                };
                
                // Endpoint trả về PayslipDetailDTO (đầy đủ số liệu) -> Update UI ngay được
                const response = await axios.post(`${API_URL}/calculate/fulltime`, payload);
                return response.data; 
            } 
            
            // CASE 2: FREELANCE (Dùng endpoint bulk cũ)
            else {
                const employeeInput = {
                    employeeId: params.employeeId,
                    freelanceSelectedBonuses: params.selectedBonuses || [],
                    freelanceSelectedPenalties: params.selectedPenalties || []
                };

                const payload = {
                    month: parseInt(params.month),
                    year: parseInt(params.year),
                    employeeInputs: [employeeInput]
                };

                // Endpoint này chỉ trả về { success: true }
                const response = await axios.post(`${API_URL}/calculate`, payload);
                return response.data;
            }
        } catch (error) {
            throw error.response?.data || { message: "Lỗi tính toán lại" };
        }
    },

    // =================================================================
    // 3. CHI TIẾT & TRẠNG THÁI
    // =================================================================

    // Lấy chi tiết phiếu lương (Popup View)
    getPayslipDetail: async (record) => {
        try {
            if (!record.payrollId || !record.employeeId) {
                // Nếu chưa có payrollId (chưa tính lương lần nào), return null để UI xử lý
                return null;
            }

            const response = await axios.get(`${API_URL}/${record.payrollId}/employee/${record.employeeId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching detail:", error);
            throw error;
        }
    },

    // Chốt sổ lương (Lock)
    lockPayroll: async (payrollId) => {
        try {
            const response = await axios.post(`${API_URL}/${payrollId}/lock`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "Không thể chốt lương" };
        }
    },

    // Helper tính toán thống kê (Client-side)
    calculateStatsFromList: (list) => {
        if (!list || list.length === 0) {
            return {
                totalNet: 0, totalGross: 0, totalEmployees: 0, 
                paidEmployees: 0, pendingCount: 0, status: 'Unpaid'
            };
        }

        const totalNet = list.reduce((sum, item) => sum + (item.netPay || 0), 0);
        const totalGross = list.reduce((sum, item) => sum + (item.grossPay || 0), 0);
        const totalEmployees = list.length;
        const paidEmployees = list.filter(i => i.status === 'Paid').length;
        const pendingCount = list.filter(i => i.status === 'Unpaid').length;

        let overallStatus = 'Unpaid';
        if (list.length > 0 && list[0].payrollId) { 
             overallStatus = list[0].status; 
        }

        return {
            totalNet,
            totalGross,
            totalEmployees,
            paidEmployees,
            pendingCount,
            status: overallStatus
        };
    }
};