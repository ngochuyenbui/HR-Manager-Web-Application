package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "timesheet")
@Data
public class Timesheet {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "checkin_time")
    private LocalDateTime checkIn;

    @Column(name = "checkout_time")
    private LocalDateTime checkOut;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
