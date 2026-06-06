package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TimesheetDTO {

    private String id;
    private String employeeId;
    private String employeeName;
    private String employeeType;

    private String date;
    private String checkIn;
    private String checkOut;

    // tổng giờ làm trong ngày (đã gồm OT)
    private double totalHours;

    // số giờ OT trong ngày
    private double overtimeHours;

    private String status;
}
