package com.example.demo.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FreelanceContractTerm {
    private String name;
    private BigDecimal amount;
    private BigDecimal rate;
    private String type;
}
