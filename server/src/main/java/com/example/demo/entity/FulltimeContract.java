package com.example.demo.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

import java.util.Set;
import java.math.BigDecimal;
import com.example.demo.entity.subtable.FulltimeContractAllowance;
import com.example.demo.entity.subtable.FulltimeContractBonus;
import com.example.demo.entity.subtable.FulltimeContractDeduction;

@Entity
@Table(name = "fulltime_contract")
@lombok.Getter
@lombok.Setter
@lombok.NoArgsConstructor
@lombok.AllArgsConstructor
public class FulltimeContract {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contract_id")
    private Long contractId;

    @Column(name = "employee_id")
    private Long employeeId;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "base_salary")
    private BigDecimal baseSalary;

    @Column(name = "ot_rate")
    private BigDecimal otRate;

    @Column(name = "standard_work_days")
    private BigDecimal standardWorkDays;

    @Column(name = "annual_leave_days")
    private Integer annualLeaveDays;

    @Column(name = "type", columnDefinition = "text")
    private String type;

    @Column(name = "document_path")
    private String documentPath;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Set<FulltimeContractAllowance> allowances;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Set<FulltimeContractBonus> bonuses;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Set<FulltimeContractDeduction> deductions;
}