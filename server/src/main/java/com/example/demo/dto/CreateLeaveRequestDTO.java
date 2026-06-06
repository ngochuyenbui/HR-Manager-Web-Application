package com.example.demo.dto;

import lombok.Data;

@Data
public class CreateLeaveRequestDTO {
    private String startDate;
    private String endDate;
    private String leaveType;
    private String reason;
    private Long employeeCreate;
}
