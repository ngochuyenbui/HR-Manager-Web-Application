package com.example.demo.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class PayrollRequest {
    private Long payrollId;
    private int month;
    private int year;
    
    private List<EmployeeInput> employeeInputs;

    @Data
    public static class EmployeeInput {
        private Long employeeId;
        
        // --- FULLTIME INPUTS (REQUIRED FOR NEW LOGIC) ---
        private BigDecimal actualWorkDays;
        private BigDecimal otHours;
        
        private Map<String, BigDecimal> fulltimeManualBonuses;   // Key: "holiday"
        private Map<String, BigDecimal> fulltimeManualPenalties;
        
        // --- FREELANCE INPUTS ---
        private List<String> freelanceSelectedBonuses;
        private List<String> freelanceSelectedPenalties;
    }
}