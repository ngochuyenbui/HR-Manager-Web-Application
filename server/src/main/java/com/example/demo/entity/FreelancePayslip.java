package com.example.demo.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

import com.example.demo.entity.subtable.FreelanceActualBonus;
import com.example.demo.entity.subtable.FreelanceActualPenalty;

@Entity
@Table(name = "freelance_payslip")
public class FreelancePayslip {

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

    @Column(name = "final_amount")
    private BigDecimal finalAmount;

    // Getters and Setters
    public Long getPayslipId() { return payslipId; }
    public void setPayslipId(Long payslipId) { this.payslipId = payslipId; }
    public Long getPayrollId() { return payrollId; }
    public void setPayrollId(Long payrollId) { this.payrollId = payrollId; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public BigDecimal getFinalAmount() { return finalAmount; }
    public void setFinalAmount(BigDecimal finalAmount) { this.finalAmount = finalAmount; }

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "payslip_id", referencedColumnName = "payslip_id", insertable = false, updatable = false)
    private java.util.List<FreelanceActualBonus> bonuses;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "payslip_id", referencedColumnName = "payslip_id", insertable = false, updatable = false)
    private java.util.List<FreelanceActualPenalty> penalties;

    public java.util.List<FreelanceActualBonus> getBonuses() { return bonuses; }
    public java.util.List<FreelanceActualPenalty> getPenalties() { return penalties; }
    
    // Thêm vào FreelancePayslip.java
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_id", insertable = false, updatable = false)
    private Payroll payroll;

    public Payroll getPayroll() { return payroll; }
    public void setPayroll(Payroll payroll) { this.payroll = payroll; }
}