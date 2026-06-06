package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fulltime-contracts")
@CrossOrigin(origins = "*")
public class FinancialController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @GetMapping("/{id}/financials")
    public ResponseEntity<?> getFinancials(@PathVariable String id) {
        List<Map<String, Object>> allowances = jdbcTemplate.queryForList(
                "SELECT Name as name, AmountPerMonth as amount FROM FullCon_Allowance WHERE FullCon_ID = ?",
                id
        );

        List<Map<String, Object>> deductions = jdbcTemplate.queryForList(
                "SELECT Name as name, Amount as amount FROM FullCon_Deduction WHERE FullCon_ID = ?",
                id
        );

        List<Map<String, Object>> bonuses = jdbcTemplate.queryForList(
                "SELECT Name as name, Amount as amount FROM FullCon_Bonus WHERE FullCon_ID = ?",
                id
        );

        return ResponseEntity.ok(Map.of(
                "allowances", allowances,
                "deductions", deductions,
                "bonuses", bonuses
        ));
    }
}
