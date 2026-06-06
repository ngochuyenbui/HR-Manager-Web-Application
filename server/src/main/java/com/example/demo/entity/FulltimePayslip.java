package com.example.demo.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

import com.example.demo.entity.subtable.FulltimeActualAllowance;
import com.example.demo.entity.subtable.FulltimeActualBonus;
import com.example.demo.entity.subtable.FulltimePayslipDeduction;

@Entity
@Table(name = "fulltime_payslip")
public class FulltimePayslip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payslip_id")
    private Long payslipId;

    @Column(name = "payroll_id")
    private Long payrollId;

    @Column(name = "employee_id")
    private Long employeeId;

    @Column(name = "contract_id")
    private Long contractId;

    @Column(name = "net_salary")
    private BigDecimal netSalary;

    @Column(name = "gross_salary")
    private BigDecimal grossSalary;

    // --- [NEW FIELDS] SNAPSHOT DATA FOR FORMULA ---
    @Column(name = "snap_actual_work_days")
    private BigDecimal snapActualWorkDays;

    @Column(name = "snap_ot_hours")
    private BigDecimal snapOtHours;

    @Column(name = "snap_taxable_income")
    private BigDecimal snapTaxableIncome;

    // Getters and Setters
    public Long getPayslipId() { return payslipId; }
    public void setPayslipId(Long payslipId) { this.payslipId = payslipId; }
    public Long getPayrollId() { return payrollId; }
    public void setPayrollId(Long payrollId) { this.payrollId = payrollId; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    // Thêm đoạn này vào file FulltimePayslip.java
    public BigDecimal getGrossSalary() { return grossSalary; }
    public void setGrossSalary(BigDecimal grossSalary) { this.grossSalary = grossSalary; }
    public BigDecimal getNetSalary() { return netSalary; }
    public void setNetSalary(BigDecimal netSalary) { this.netSalary = netSalary; }

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "payslip_id", referencedColumnName = "payslip_id", insertable = false, updatable = false)
    private java.util.List<FulltimeActualAllowance> allowances;

    // 2. Danh sách Thưởng
    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "payslip_id", referencedColumnName = "payslip_id", insertable = false, updatable = false)
    private java.util.List<FulltimeActualBonus> bonuses;

    // 3. Danh sách Khấu trừ
    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "payslip_id", referencedColumnName = "payslip_id", insertable = false, updatable = false)
    private java.util.List<FulltimePayslipDeduction> deductions;

    // GETTERS (Nếu bạn dùng Lombok @Data rồi thì KHÔNG cần viết tay mấy dòng này, Lombok tự sinh)
    // Nếu chưa dùng Lombok hoặc muốn tường minh thì giữ lại:
    public java.util.List<FulltimeActualAllowance> getAllowances() { return allowances; }
    public java.util.List<FulltimeActualBonus> getBonuses() { return bonuses; }
    public java.util.List<FulltimePayslipDeduction> getDeductions() { return deductions; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_id", insertable = false, updatable = false)
    private Payroll payroll;

    public Payroll getPayroll() {
        return payroll;
    }

    public void setPayroll(Payroll payroll) {
        this.payroll = payroll;
    }
}