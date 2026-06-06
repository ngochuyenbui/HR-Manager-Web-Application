import React, { useState, useEffect } from 'react';
import { PayrollService } from '../services/payrollService';
import PayslipDetailModal from '../components/PayslipDetailModal';
import PayslipCalculationModal from '../components/PayslipCalculationModal';
import { FiDollarSign, FiUsers, FiEye, FiEdit } from 'react-icons/fi';
import { IoFlag } from "react-icons/io5";
import { GrMoney } from "react-icons/gr";

const PayrollPage = () => {
    // State quản lý dữ liệu
    const today = new Date();
    
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [payrollList, setPayrollList] = useState([]);
    const [stats, setStats] = useState({
        totalNet: 0, totalGross: 0, paidEmployees: 0, totalEmployees: 0, pendingCount: 0, failedCount: 0
    });
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // State Modal
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // State for Calculation Modal (Freelance)
    const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
    const [calcRecord, setCalcRecord] = useState(null);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [month, year]);

    const fetchData = async () => {
        setLoading(true);
        const data = await PayrollService.getPayrollList(month, year);
        setPayrollList(data);
        setStats(PayrollService.calculateStatsFromList(data));
        setLoading(false);
    };

    const handleGenerate = async () => {
        if (window.confirm("Tính toán lại lương cho tháng này?")) {
            setLoading(true);
            try {
                await PayrollService.calculateAll(month, year);
                fetchData();
            } catch (e) { alert("Lỗi: " + e); }
            finally { setLoading(false); }
        }
    };

    const getEndOfMonthDate = () => {
        // new Date(year, month, 0) sẽ trả về ngày cuối cùng của tháng đó
        // (Vì trong JS Date constructor: tháng chạy 0-11, nhưng tham số 'day' là 0 sẽ lùi về ngày cuối tháng trước.
        // Tuy nhiên logic của chúng ta: month state là 1-12. Ví dụ chọn tháng 11.
        // new Date(2025, 11, 0) -> Ngày 0 của tháng 12 (tức 30/11)
        const lastDay = new Date(year, month, 0);
        return lastDay.toLocaleDateString('vi-VN');
    };

    const handleLock = async () => {
        if (stats.status === 'Paid') return;
        if (payrollList.length === 0 || !payrollList[0].payrollId) {
            alert("Không tìm thấy kỳ lương để chốt.");
            return;
        }

        // Lấy payrollId từ dòng đầu tiên (vì cả bảng chung 1 kỳ lương)
        const payrollId = payrollList[0].payrollId;

        if (window.confirm("Xác nhận CHỐT SỔ LƯƠNG (Paid)?")) {
            setLoading(true);
            try {
                await PayrollService.lockPayroll(payrollId);
                fetchData(); // Load lại để update status -> Paid
            } catch (e) {
                console.error(e);
                // Ưu tiên hiển thị message từ backend trả về
                const errorMsg = e.message || (e.response && e.response.data && e.response.data.message) || JSON.stringify(e);
                alert("Lỗi: " + errorMsg);
            }
            finally { setLoading(false); }
        }
    };

    const formatMoney = (val) => {
        if (val === null || val === undefined || val === 0) {
            return '0 ₫';
        }

        // Định dạng số (1.000.000) và thêm ký hiệu ₫
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
        }).format(val);
    };


    const filteredList = payrollList.filter(item =>
        item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={styles.container}>

            {/* Stats Cards Section (Đã Cập Nhật Lại Bố Cục Icon) */}
            <div style={styles.statsGrid}>

                {/* Card 1: Gross */}
                <div style={styles.card}>
                    <div style={{ ...styles.cardIconContainer, backgroundColor: styles.iconBgGreen }}>
                        <GrMoney size={30} color="#df7300ff" />
                    </div>
                    <div style={styles.cardContent}>
                        <div style={styles.cardLabel}>This Month's GROSS</div>
                        <div style={styles.cardValueLarge}>{formatMoney(stats.totalGross)}</div>
                    </div>
                </div>

                {/* Card 2: Net */}
                <div style={styles.card}>
                    <div style={{ ...styles.cardIconContainer, backgroundColor: styles.iconBgGreen }}>
                        <FiDollarSign size={30} color="#10b981" />
                    </div>
                    <div style={styles.cardContent}>
                        <div style={styles.cardLabel}>This Month's NET</div>
                        <div style={styles.cardValueLarge}>{formatMoney(stats.totalNet)}</div>
                    </div>
                </div>

                {/* Card 3: Employees Paid */}
                <div style={styles.card}>
                    <div style={{ ...styles.cardIconContainer, backgroundColor: styles.iconBgBlue }}>
                        <FiUsers size={30} color="#3b82f6" />
                    </div>
                    <div style={styles.cardContent}>
                        <div style={styles.cardLabel}>Employees Paid</div>
                        <div style={styles.cardValueLarge}>
                            {stats.paidEmployees} <span style={styles.cardSub}>/ {stats.totalEmployees}</span>
                        </div>
                    </div>
                </div>

                {/* Card 4: Status Count (Giữ nguyên bố cục dọc) */}
                <div style={styles.card}>
                    <div style={{ ...styles.cardIconContainer, backgroundColor: styles.iconBgBlue }}>
                        <IoFlag size={30} color="#ab45ffff" />
                    </div>
                    <div style={styles.cardContent}>
                        <div style={styles.cardLabel}> Pending</div>
                        <div style={styles.cardValueLarge}>
                            <span style={styles.statCount}>{stats.pendingCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Section */}
            <div style={styles.controlsBar}>
                <div style={styles.controlGroup}>
                    <input
                        type="number"
                        style={styles.yearInput}
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                        placeholder="Month"
                        min="1"
                        max="12"
                    />
                    <input
                        type="number"
                        style={styles.yearInput}
                        value={year}
                        onChange={e => setYear(e.target.value)}
                    />
                </div>

                <div style={styles.controlGroup}>
                    <input type="text" placeholder="Search Payroll Record..." style={styles.searchInput} />

                    {/* Nút Calculate: Disable nếu đã Paid */}
                    <button
                        style={{
                            ...styles.btnAction,
                            opacity: stats.status === 'Paid' ? 0.6 : 1,
                            cursor: stats.status === 'Paid' ? 'not-allowed' : 'pointer'
                        }}
                        onClick={handleGenerate}
                        disabled={stats.status === 'Paid'}
                    >
                        Calculate
                    </button>

                    {/* Nút Confirm/Lock: Thay đổi text và trạng thái dựa trên status */}
                    <button
                        style={{
                            ...styles.btnPrimary,
                            opacity: stats.status === 'Paid' ? 0.6 : 1,
                            cursor: stats.status === 'Paid' ? 'not-allowed' : 'pointer',
                            backgroundColor: stats.status === 'Paid' ? '#3bd6a2ff' : '#fffb87ff',
                            color: 'black'
                        }}
                        onClick={handleLock}
                        disabled={stats.status === 'Paid'}
                    >
                        {stats.status === 'Paid' ? '✓ Disbursed' : 'Confirm Payments'}
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeader}>
                            <th style={styles.th}>Name</th>
                            <th style={styles.th}>Department</th>
                            <th style={styles.th}>Role</th>
                            <th style={styles.th}>Gross Pay</th>
                            <th style={styles.th}>Net Pay</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Created Date</th>
                            <th style={styles.th}>Edit</th>
                            <th style={styles.th}>Detail</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="9" style={styles.loadingCell}>Loading data...</td></tr>
                        ) : filteredList.map((row, index) => (
                            <tr key={index} style={styles.tableRow}>
                                <td style={styles.td}>
                                    <div style={styles.nameCell}>
                                        <div style={styles.rowAvatar}>{row.fullName.charAt(0)}</div>
                                        <span style={styles.nameText}>{row.fullName}</span>
                                    </div>
                                </td>
                                <td style={styles.td}>{row.department}</td>
                                <td style={styles.td}>{row.role}</td>
                                <td style={styles.td}><strong>{formatMoney(row.grossPay)}</strong></td>
                                <td style={styles.td}><strong>{formatMoney(row.netPay)}</strong></td>
                                <td style={styles.td}>
                                    <span style={getStatusStyle(row.status)}>
                                        {row.status === 'Paid' ? '✓ Paid' : row.status === 'Unpaid' ? '⚑ Pending' : '✕ Failed'}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    {row.payslipId ? getEndOfMonthDate() : '-'}
                                </td>
                                <td style={styles.tdAction}>
                                    {row.status !== 'Paid' && (
                                        <button style={styles.btnCalc} onClick={() => { setCalcRecord(row); setIsCalcModalOpen(true); }} title="Edit/Calculate">
                                            <FiEdit size={16} />
                                        </button>
                                    )}
                                </td>
                                <td style={styles.tdAction}>
                                    {row.payslipId && (
                                        <button style={styles.btnIcon} onClick={() => { setSelectedRecord(row); setIsModalOpen(true); }}>
                                            <FiEye size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <PayslipDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                record={selectedRecord}
            />

            <PayslipCalculationModal
                isOpen={isCalcModalOpen}
                onClose={() => setIsCalcModalOpen(false)}
                record={calcRecord}
                onSuccess={fetchData}
                month={month}
                year={year}
            />
        </div>
    );
};

// --- Helper Functions ---
const getStatusStyle = (status) => {
    switch (status) {
        case 'Paid': return styles.badgeSuccess;
        case 'Unpaid': return styles.badgePending;
        default: return styles.badgeFailed;
    }
};

// --- Styles (JS Object) ---
const styles = {
    container: {
        padding: '24px',
        backgroundColor: '#f5f6fa',
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    },
    title: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    userInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    avatarPlaceholder: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
    },
    // Stats Cards
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '20px',
        marginBottom: '24px',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        border: '1px solid #e5e7eb',
        display: 'flex', // Bố cục ngang
        alignItems: 'center',
        gap: '12px',
    },
    cardIconContainer: { // Hình tròn bao quanh icon
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0, // Đảm bảo container không bị co lại
    },
    cardContent: {
        flexGrow: 1, // Nội dung sẽ chiếm phần còn lại
    },
    cardLabel: {
        fontSize: '13px',
        color: '#6b7280',
        marginBottom: '8px',
        fontWeight: '500',
    },
    cardValueLarge: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#111827',
    },
    cardSub: {
        fontSize: '14px',
        color: '#9ca3af',
        fontWeight: 'normal',
    },
    progressBarBg: {
        height: '6px',
        backgroundColor: '#f3f4f6',
        borderRadius: '3px',
        marginTop: '12px',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#10b981', // Green
        borderRadius: '3px',
    },
    statRow: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '14px',
        color: '#374151',
        marginBottom: '8px',
        fontWeight: '500',
    },
    pendingDot: { color: '#8b5cf6', marginRight: '8px', fontSize: '18px' }, // Purple
    failedDot: { color: '#ef4444', marginRight: '8px', fontSize: '18px' }, // Red
    statCount: { marginLeft: 'auto', fontWeight: 'bold' },

    // Controls
    controlsBar: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '16px',
    },
    controlGroup: { display: 'flex', gap: '10px' },
    selectInput: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        outline: 'none',
    },
    yearInput: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        width: '80px',
    },
    searchInput: {
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        width: '240px',
    },
    btnAction: {
        padding: '8px 16px',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        backgroundColor: 'white',
        cursor: 'pointer',
        fontWeight: '500',
    },
    btnPrimary: {
        padding: '8px 16px',
        borderRadius: '6px',
        border: 'none',
        backgroundColor: '#10b981', // Lunar Green
        color: 'white',
        cursor: 'pointer',
        fontWeight: '500',
    },

    // Table
    tableContainer: {
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
    },
    tableHeader: {
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
    },
    th: {
        padding: '12px 24px',
        fontSize: '12px',
        textTransform: 'uppercase',
        color: '#6b7280',
        fontWeight: '600',
    },
    tableRow: {
        borderBottom: '1px solid #f3f4f6',
    },
    td: {
        padding: '16px 24px',
        fontSize: '14px',
        color: '#1f2937',
        verticalAlign: 'middle',
        //textAlign: 'center',
    },
    tdAction: {
        padding: '16px 24px',
        fontSize: '14px',
        color: '#1f2937',
        verticalAlign: 'middle',
        textAlign: 'center', // Căn giữa nội dung chỉ cho cột này
    },
    nameCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    rowAvatar: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: '#e0e7ff', // Light indigo
        color: '#4338ca',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
    },
    nameText: {
        fontWeight: '500',
    },
    // Badges
    badgeSuccess: {
        backgroundColor: '#d1fae5',
        color: '#065f46',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
    },
    badgePending: {
        backgroundColor: '#ede9fe',
        color: '#5b21b6',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
    },
    badgeFailed: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '500',
    },
    btnIcon: {
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        color: '#9ca3af',
        fontSize: '16px',
    },
    btnCalc: {
        border: 'none',
        background: '#e0f2fe',
        cursor: 'pointer',
        color: '#0369a1',
        fontSize: '16px',
        padding: '6px 8px',
        borderRadius: '4px',
        marginRight: '8px',
    },
    loadingCell: { textAlign: 'center', padding: '20px', color: '#6b7280' }
};

export default PayrollPage;