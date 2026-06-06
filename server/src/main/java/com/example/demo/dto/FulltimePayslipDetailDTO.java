package com.example.demo.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class FulltimePayslipDetailDTO {
    private Long payslipId;
    private Long employeeId;
    private String fullName;
    
    // Tiền tổng
    private BigDecimal grossSalary;
    private BigDecimal netSalary;
    private BigDecimal taxableIncome; // [NEW]
    private BigDecimal baseSalary;
    
    // --- INPUTS & FORMULA (QUAN TRỌNG CHO UI) ---
    private BigDecimal actualWorkDays;      // Tử số
    private BigDecimal formulaStandardDays; // Mẫu số
    private BigDecimal otHours;
    private BigDecimal formulaOtRate;
    
    // JSON Strings (Frontend sẽ parse cái này ra mảng để loop hiển thị dòng)
    private String allowancesJson;
    private String bonusesJson;
    private String deductionsJson;
}