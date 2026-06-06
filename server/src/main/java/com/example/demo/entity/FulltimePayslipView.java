package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Immutable;
import java.math.BigDecimal;

@Entity
@Immutable
@Table(name = "view_fulltime_payslip_detail")
@Data
public class FulltimePayslipView {
    @Id
    @Column(name = "payslip_id")
    private Long payslipId;

    @Column(name = "payroll_id")
    private Long payrollId;

    @Column(name = "employee_id")
    private Long employeeId;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "bank_account_number")
    private String bankAccountNumber;

    @Column(name = "gross_salary")
    private BigDecimal grossSalary;

    @Column(name = "net_salary")
    private BigDecimal netSalary;

    @Column(name = "taxable_income")
    private BigDecimal taxableIncome; 

    @Column(name = "actual_work_days") // Lấy từ snapshot
    private BigDecimal actualWorkDays;

    @Column(name = "formula_standard_days") // Lấy từ contract (Mẫu số)
    private BigDecimal formulaStandardDays;

    @Column(name = "ot_hours") // Lấy từ snapshot
    private BigDecimal otHours;

    @Column(name = "formula_ot_rate") // Lấy từ contract
    private BigDecimal formulaOtRate;

    @Column(name = "base_salary")
    private BigDecimal baseSalary;

    // ------------------------------------------
    @Column(name = "allowances_json", columnDefinition = "TEXT")
    private String allowancesJson;

    @Column(name = "bonuses_json", columnDefinition = "TEXT")
    private String bonusesJson;

    @Column(name = "deductions_json", columnDefinition = "TEXT")
    private String deductionsJson;
}