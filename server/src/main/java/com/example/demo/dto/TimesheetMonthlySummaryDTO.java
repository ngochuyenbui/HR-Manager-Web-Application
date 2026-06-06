package com.example.demo.dto;

import lombok.Data;

@Data
public class TimesheetMonthlySummaryDTO {

    private String employeeId;
    private String employeeName;
    private String employeeType;

    // tổng giờ làm trong tháng (gồm OT)
    private double totalHours;

    // tổng số giờ OT trong tháng
    private double overtimeHours;
}
