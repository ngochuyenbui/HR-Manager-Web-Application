package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class EmployeeCreationRequest {
    // 1. Employee Info
    @JsonProperty("fName") 
    private String fName;

    @JsonProperty("lName") 
    private String lName;

    @JsonProperty("mName") 
    private String mName;

    private String sex;
    private String phone;
    private String email;
    private String address;
    private LocalDate dob;
    private String type; 
    private String username;
    private String password;
    private String bankAccountNumber;

    // 2. Contract Info (Nested Object from Frontend)
    private ContractData contract;

    @Data
    public static class ContractData {
        private LocalDate startDate;
        private LocalDate endDate;
        private String contractType; // Indefinite/Definite
        private Double baseSalary;
        private Double otRate;
        private Integer annualLeaveDays;
        
        // Freelance specific
        private Double contractValue;
        private LocalDate committedDeadline;

        // Dynamic Lists
        private List<FinancialItem> allowances;
        private List<FinancialItem> bonuses;
        private List<FinancialItem> deductions;
        private List<FinancialItem> penalties;
    }

    @Data
    public static class FinancialItem {
        private String name;
        private Double amount;
    }
}