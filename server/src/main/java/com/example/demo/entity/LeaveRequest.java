package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_request")
@Data
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "leave_type")
    private String leaveType;

    @Column(name = "reason")
    private String reason;

    @Column(name = "is_approved")
    private Boolean isApproved;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "employee_create")
    private Long employeeCreate;

    @Column(name = "hr_approve")
    private Long hrApprove;
}
