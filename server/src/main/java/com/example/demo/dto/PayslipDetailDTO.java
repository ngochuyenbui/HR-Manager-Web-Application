package com.example.demo.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayslipDetailDTO {

    private Long payslipId;
    private Long payrollId;
    private Long employeeId;

    private String fullName;
    private String bankAccountNumber;
    
    private BigDecimal baseSalary;   // Lương cứng hợp đồng
    private BigDecimal grossSalary;  // Tổng thu nhập
    private BigDecimal netSalary;    // Thực lãnh
    
    private BigDecimal taxableIncome; 

    // UI sẽ dùng: (baseSalary / formulaStandardDays) * actualWorkDays
    private BigDecimal actualWorkDays;      // Tử số: Ngày làm thực tế (Snapshot)
    private BigDecimal formulaStandardDays; // Mẫu số: Ngày công chuẩn (Contract)
    
    // UI sẽ dùng: (baseSalary / (formulaStandardDays * 8)) * otHours * formulaOtRate
    private BigDecimal otHours;             // Số giờ OT (Snapshot)
    private BigDecimal formulaOtRate;       // Hệ số OT (Contract)

    // Frontend sẽ loop các list này để hiện dòng chi tiết
    private List<Map<String, Object>> allowances;
    private List<Map<String, Object>> bonuses;
    private List<Map<String, Object>> deductions; // Bao gồm cả Bảo hiểm, Thuế, Phạt
}