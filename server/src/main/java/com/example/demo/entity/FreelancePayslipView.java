package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Immutable;
import java.math.BigDecimal;

@Entity
@Immutable
@Table(name = "view_freelance_payslip_detail")
@Data
public class FreelancePayslipView {

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

    @Column(name = "contract_total_value")
    private BigDecimal contractTotalValue;

    @Column(name = "final_amount")
    private BigDecimal finalAmount;

    @Column(name = "bonuses_json", columnDefinition = "TEXT")
    private String bonusesJson;

    @Column(name = "penalties_json", columnDefinition = "TEXT")
    private String penaltiesJson;
}