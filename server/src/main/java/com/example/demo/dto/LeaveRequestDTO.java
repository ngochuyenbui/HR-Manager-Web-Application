package com.example.demo.dto;

import lombok.Data;

@Data
public class LeaveRequestDTO {
    private Long id;
    private String name; // employee full name
    private String role; // employee type or role
    private String avatar;
    private String duration; // e.g. "3 days"
    private String date; // e.g. "23rd – 25th Aug 2022"
    private String type; // leave_type
    private String status; // approved/pending/rejected
    private String reason;
}
