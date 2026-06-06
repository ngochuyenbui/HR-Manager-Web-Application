import React, { useState, useEffect } from 'react';
import { PayrollService } from '../services/payrollService';

const PayslipCalculationModal = ({ isOpen, onClose, record, onSuccess, month, year }) => {
    // State chung
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [bonusTypes, setBonusTypes] = useState([]);

    // State cho Fulltime (Nhập tiền)
    const [manualBonuses, setManualBonuses] = useState([]); // [{ key: 'holiday', amount: 500000 }]
    const [manualPenalties, setManualPenalties] = useState([]);

    // State cho Freelance (Chỉ nhập tên khoản thưởng/phạt để kích hoạt từ hợp đồng)
    const [selectedBonuses, setSelectedBonuses] = useState([]); // List of strings ['Early Completion']
    const [selectedPenalties, setSelectedPenalties] = useState([]); // List of strings ['Late Delivery']
    const [freelanceTerms, setFreelanceTerms] = useState({ bonuses: [], penalties: [] });

    useEffect(() => {
        if (isOpen && record) {
            resetForm();
            const isFulltime = record.role === 'Fulltime' || record.contractType === 'FULLTIME';

            if (isFulltime) {
                // Load Metadata cho Fulltime (Holiday, Other)
                PayrollService.getBonusMetadata()
                    .then(data => setBonusTypes(data))
                    .catch(err => console.error("Failed to load bonus types", err));
            } else {
                // [MỚI] Load điều khoản hợp đồng cho Freelance
                PayrollService.getFreelanceTerms(record.employeeId, month, year)
                    .then(data => {
                        setFreelanceTerms(data);
                        console.log("Loaded Freelance Terms:", data);
                    })
                    .catch(err => console.error("Failed to load freelance terms", err));
            }
        }
    }, [isOpen, record, month, year]);

const resetForm = () => {
        setManualBonuses([]);
        setManualPenalties([]);
        setSelectedBonuses([]);
        setSelectedPenalties([]);
        setFreelanceTerms({ bonuses: [], penalties: [] });
        setError(null);
        setSuccess(false);
    };

    // --- HANDLERS CHO FULLTIME ---
    const addManualBonus = () => setManualBonuses([...manualBonuses, { key: '', amount: '' }]);
    
    const updateManualBonus = (index, field, value) => {
        const updated = [...manualBonuses];
        updated[index][field] = value;
        setManualBonuses(updated);
    };

    const removeManualBonus = (index) => {
        setManualBonuses(manualBonuses.filter((_, i) => i !== index));
    };

    // [NEW] Penalty Handlers
    const addManualPenalty = () => setManualPenalties([...manualPenalties, { key: '', amount: '' }]);
    const updateManualPenalty = (index, field, value) => {
        const updated = [...manualPenalties];
        updated[index][field] = value;
        setManualPenalties(updated);
    };
    const removeManualPenalty = (index) => {
        setManualPenalties(manualPenalties.filter((_, i) => i !== index));
    };
    // --- HANDLERS CHO FREELANCE ---
    const toggleFreelanceItem = (type, name) => {
        if (type === 'bonus') {
            if (selectedBonuses.includes(name)) {
                setSelectedBonuses(selectedBonuses.filter(item => item !== name));
            } else {
                setSelectedBonuses([...selectedBonuses, name]);
            }
        } else {
            if (selectedPenalties.includes(name)) {
                setSelectedPenalties(selectedPenalties.filter(item => item !== name));
            } else {
                setSelectedPenalties([...selectedPenalties, name]);
            }
        }
    };

    // --- SUBMIT ---
    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const isFulltime = record.role === 'Fulltime' || record.contractType === 'FULLTIME';
            
            const params = {
                month,
                year,
                employeeId: record.employeeId,
                type: isFulltime ? 'Fulltime' : 'Freelance'
            };

            if (isFulltime) {
                // Validate & Map Fulltime data
                const bonusesMap = {};
                manualBonuses.forEach(b => {
                    if (b.key && b.amount) bonusesMap[b.key] = parseFloat(b.amount);
                });
                params.manualBonuses = bonusesMap;

                // 2. Map Penalties [NEW]
                const penaltiesMap = {};
                manualPenalties.forEach(p => {
                    // Với Penalty, key có thể là free text nếu BE cho phép, hoặc dropdown nếu có Metadata
                    // Ở đây giả sử nhập text lý do phạt vào input key
                    if (p.key && p.amount) penaltiesMap[p.key] = parseFloat(p.amount);
                });
                params.manualPenalties = penaltiesMap;
            } else {
                // Validate & Map Freelance data (Filter empty strings)
                params.selectedBonuses = selectedBonuses.filter(s => s.trim() !== '');
                params.selectedPenalties = selectedPenalties.filter(s => s.trim() !== '');
            }

            // Gọi Service Unified (recalculateSingle đã được định nghĩa trong payrollService mới)
            await PayrollService.recalculateSingle(params);

            setSuccess(true);
            if (onSuccess) onSuccess();
            setTimeout(() => onClose(), 1000);
        } catch (err) {
            setError(err.message || 'Tính toán thất bại');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        if (!val) return '0 ₫';
        return Number(val).toLocaleString('vi-VN') + ' ₫';
    };

    if (!isOpen || !record) return null;
    const isFulltime = record.role === 'Fulltime' || record.contractType === 'FULLTIME';

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <button style={styles.closeBtn} onClick={onClose}>&times;</button>

                <h2 style={styles.title}>Recalculate Payslip</h2>
                <div style={styles.info}>
                    <span style={styles.name}>{record.fullName}</span>
                    <span style={isFulltime ? styles.badgeFulltime : styles.badgeFreelance}>
                        {record.role || record.contractType}
                    </span>
                </div>

                <div style={styles.baseInfo}>
                    <strong>Current Net Pay:</strong> {formatCurrency(record.netPay)}
                </div>

                {error && <div style={styles.error}>{error}</div>}
                {success && <div style={styles.success}>Cập nhật thành công!</div>}

                {/* --- FORM CHO FULLTIME --- */}
                {isFulltime && (
                    <>
                        {/* 1. Bonuses Section */}
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Manual Bonuses (Thưởng nhập tay)</h3>
                            {manualBonuses.map((item, idx) => (
                                <div key={idx} style={styles.row}>
                                    <select
                                        value={item.key}
                                        onChange={(e) => updateManualBonus(idx, 'key', e.target.value)}
                                        style={styles.select}
                                    >
                                        <option value="" disabled>Select Type</option>
                                        {bonusTypes.map(t => (
                                            <option key={t.key} value={t.key}>{t.label}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number" 
                                        placeholder="Amount (VND)" 
                                        value={item.amount}
                                        onChange={(e) => updateManualBonus(idx, 'amount', e.target.value)}
                                        style={styles.input}
                                    />
                                    <button onClick={() => removeManualBonus(idx)} style={styles.removeBtn}>✕</button>
                                </div>
                            ))}
                            <button onClick={addManualBonus} style={styles.addBtn}>+ Add Bonus</button>
                        </div>
                        {/* 2. Penalties Section [NEW] */}
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Manual Penalties (Phạt)</h3>
                            {manualPenalties.map((item, idx) => (
                                <div key={idx} style={styles.row}>
                                    {/* Penalty Key có thể là Text input vì lý do phạt đa dạng */}
                                    <input 
                                        type="text"
                                        placeholder="Reason (e.g. Late, Damage)"
                                        value={item.key}
                                        onChange={(e) => updateManualPenalty(idx, 'key', e.target.value)}
                                        style={styles.select} // Tái sử dụng style
                                    />
                                    <input
                                        type="number" 
                                        placeholder="Amount" 
                                        value={item.amount}
                                        onChange={(e) => updateManualPenalty(idx, 'amount', e.target.value)}
                                        style={styles.input}
                                    />
                                    <button onClick={() => removeManualPenalty(idx)} style={styles.removeBtn}>✕</button>
                                </div>
                            ))}
                            <button onClick={addManualPenalty} style={{...styles.addBtn, backgroundColor: '#fee2e2', color: '#dc2626'}}>+ Add Penalty</button>
                        </div>
                    </>
                )}

                {/* --- FORM CHO FREELANCE --- */}
                {!isFulltime && (
                    <>
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Bonuses</h3>
                            <p style={styles.hint}>Tích chọn các khoản thưởng (nếu có)</p>
                            
                            {freelanceTerms.bonuses.length === 0 && <p style={styles.warning}>Không tìm thấy điều khoản thưởng nào.</p>}

                            <div style={styles.checkboxList}>
                                {freelanceTerms.bonuses.map((term, idx) => (
                                    <div key={idx} style={{...styles.checkboxRow, display: 'flex', alignItems: 'center', gap: '8px'}} onClick={() => toggleFreelanceItem('bonus', term.name)}>
                                        <input 
                                            type="checkbox"
                                            checked={selectedBonuses.includes(term.name)}
                                            readOnly // Xử lý bằng onClick ở div cha để tăng vùng bấm
                                            style={styles.checkbox}
                                        />
                                        <span style={styles.checkboxLabel}>
                                            {term.name} 
                                            <span style={styles.termValue}>
                                                {term.amount ? ` (+${formatCurrency(term.amount)})` : term.rate ? ` (+${term.rate}%)` : ''}
                                            </span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>Penalties</h3>
                            <p style={styles.hint}>Tích chọn các khoản phạt (nếu có)</p>

                            {freelanceTerms.penalties.length === 0 && <p style={styles.warning}>Không tìm thấy điều khoản phạt nào.</p>}

                            <div style={styles.checkboxList}>
                                {freelanceTerms.penalties.map((term, idx) => (
                                    <div key={idx} style={{...styles.checkboxRow, display: 'flex', alignItems: 'center', gap: '8px'}} onClick={() => toggleFreelanceItem('penalty', term.name)}>
                                        <input 
                                            type="checkbox"
                                            checked={selectedPenalties.includes(term.name)}
                                            readOnly
                                            style={styles.checkbox}
                                        />
                                        <span style={styles.checkboxLabel}>
                                            {term.name}
                                            <span style={styles.termValuePenalty}>
                                                {term.amount ? ` (-${formatCurrency(term.amount)})` : term.rate ? ` (-${term.rate}%)` : ''}
                                            </span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Actions */}
                <div style={styles.actions}>
                    <button onClick={onClose} style={styles.cancelBtn} disabled={loading}>Close</button>
                    <button onClick={handleSubmit} style={styles.submitBtn} disabled={loading}>
                        {loading ? 'Processing...' : 'Save & Recalculate'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 1000,
        backdropFilter: 'blur(2px)',
    },
    modal: {
        backgroundColor: '#fff', borderRadius: '12px', padding: '30px',
        width: '550px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto',
        position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        fontFamily: "'Inter', sans-serif",
    },
    closeBtn: {
        position: 'absolute', top: '15px', right: '20px', fontSize: '28px',
        border: 'none', background: 'none', cursor: 'pointer', color: '#888',
    },
    title: { fontSize: '22px', fontWeight: '700', color: '#1a1a1a', marginBottom: '10px', marginTop: 0 },
    info: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' },
    name: { fontSize: '18px', fontWeight: '600', color: '#333' },
    badgeFulltime: { backgroundColor: '#e3f2fd', color: '#3861c2', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
    badgeFreelance: { backgroundColor: '#f3e5f5', color: '#c05beb', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
    baseInfo: { marginBottom: '20px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' },
    error: { color: '#dc3545', backgroundColor: '#fff5f5', padding: '10px', borderRadius: '8px', marginBottom: '15px' },
    success: { color: '#059669', backgroundColor: '#ecfdf5', padding: '10px', borderRadius: '8px', marginBottom: '15px' },
    section: { marginBottom: '20px' },
    sectionTitle: { fontSize: '15px', fontWeight: '600', color: '#374151', marginBottom: '8px' },
    label: { display: 'block', fontSize: '14px', marginBottom: '6px', color: '#374151', fontWeight: '500' },
    hint: { fontSize: '12px', color: '#9ca3af', marginBottom: '8px', fontStyle: 'italic' },
    row: { display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' },
    input: { flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' },
    select: { flex: 1, padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' },
    removeBtn: { backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', fontWeight: '600' },
    addBtn: { backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', fontWeight: '500', fontSize: '13px' },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' },
    cancelBtn: { backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', padding: '12px 24px', cursor: 'pointer', fontWeight: '600' },
    submitBtn: { backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', cursor: 'pointer', fontWeight: '600' },
};

export default PayslipCalculationModal;