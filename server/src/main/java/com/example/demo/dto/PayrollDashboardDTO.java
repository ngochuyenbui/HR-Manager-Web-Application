package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PayrollDashboardDTO {
    private Long employeeId;
    private String fullName;
    private String department; // Hardcode "Engineering" hoặc lấy từ DB
    private String role; // Fulltime/Freelance
    private BigDecimal grossPay;
    private BigDecimal netPay;
    private String status;
    private Date paymentDate;
    private Long payslipId; // ID để gọi API chi tiết
    private String contractType; // "Fulltime" or "Freelance"
    private Long payrollId;
}