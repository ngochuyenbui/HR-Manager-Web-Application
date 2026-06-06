package com.example.demo.controller;

import com.example.demo.entity.FulltimeContract;
import com.example.demo.entity.subtable.FulltimeContractAllowance;
import com.example.demo.entity.subtable.FulltimeContractBonus;
import com.example.demo.entity.subtable.FulltimeContractDeduction;
import com.example.demo.repository.FulltimeContractRepository;
import com.example.demo.repository.FulltimeContractAllowanceRepository;
import com.example.demo.repository.FulltimeContractBonusRepository;
import com.example.demo.repository.FulltimeContractDeductionRepository;
import com.example.demo.repository.PayrollRepository;

import com.example.demo.entity.Employee;
import com.example.demo.repository.EmployeeRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/fulltime-contracts")
@CrossOrigin(origins = "*")
public class ContractController {

    @Autowired
    private FulltimeContractRepository fulltimeContractRepository;

    @Autowired
    private FulltimeContractAllowanceRepository allowanceRepository;

    @Autowired
    private FulltimeContractBonusRepository bonusRepository;

    @Autowired
    private FulltimeContractDeductionRepository deductionRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PayrollRepository payrollRepository;

    // -----------------------------
    // GET ALL
    // -----------------------------
    @GetMapping
    public List<FulltimeContract> getAllContracts() {
        return fulltimeContractRepository.findAll();
    }

    // -----------------------------
    // GET BY CONTRACT ID (with employee info)
    // -----------------------------
    @GetMapping("/{id}")
    public ResponseEntity<?> getContractById(@PathVariable Long id) {
        FulltimeContract contract = fulltimeContractRepository.findById(id).orElse(null);
        if (contract == null) {
            return ResponseEntity.status(404).body(Map.of("message", "Contract not found"));
        }

        // Build response with additional info
        Map<String, Object> response = new HashMap<>();
        response.put("contractId", contract.getContractId());
        response.put("employeeId", contract.getEmployeeId());
        response.put("startDate", contract.getStartDate());
        response.put("endDate", contract.getEndDate());
        response.put("baseSalary", contract.getBaseSalary());
        response.put("otRate", contract.getOtRate());
        response.put("annualLeaveDays", contract.getAnnualLeaveDays());
        response.put("type", contract.getType());
        response.put("documentPath", contract.getDocumentPath());

        // Build document URL if path exists
        if (contract.getDocumentPath() != null && !contract.getDocumentPath().isEmpty()) {
            response.put("document_url", "/api/employees/uploads/contracts/" +
                    contract.getDocumentPath().substring(contract.getDocumentPath().lastIndexOf("/") + 1));
        }

        // Get employee info for bank account and payment method
        Employee emp = employeeRepository.findById(contract.getEmployeeId()).orElse(null);
        if (emp != null) {
            String bankAccount = emp.getBankAccountNumber();
            response.put("bank_account", bankAccount);
            // If bank account exists, payment is Bank Transfer; otherwise Cash
            if (bankAccount != null && !bankAccount.trim().isEmpty()) {
                response.put("payment_method", "Bank Transfer");
            } else {
                response.put("payment_method", "Cash");
            }
            String fullName = (emp.getFName() != null ? emp.getFName() : "") + " " +
                    (emp.getMName() != null ? emp.getMName() + " " : "") +
                    (emp.getLName() != null ? emp.getLName() : "");
            response.put("employee_name", fullName.trim());
        }

        return ResponseEntity.ok(response);
    }

    // -----------------------------
    // GET ALLOWANCES BY CONTRACT ID
    // -----------------------------
    @GetMapping("/{id}/allowances")
    public ResponseEntity<?> getAllowancesByContractId(@PathVariable Long id) {
        List<FulltimeContractAllowance> allowances = allowanceRepository.findByContractIdOrderByStt(id);
        return ResponseEntity.ok(allowances);
    }

    // -----------------------------
    // GET BONUSES BY CONTRACT ID
    // -----------------------------
    @GetMapping("/{id}/bonuses")
    public ResponseEntity<?> getBonusesByContractId(@PathVariable Long id) {
        List<FulltimeContractBonus> bonuses = bonusRepository.findByContractIdOrderByStt(id);
        return ResponseEntity.ok(bonuses);
    }

    // -----------------------------
    // GET DEDUCTIONS BY CONTRACT ID
    // -----------------------------
    @GetMapping("/{id}/deductions")
    public ResponseEntity<?> getDeductionsByContractId(@PathVariable Long id) {
        List<FulltimeContractDeduction> deductions = deductionRepository.findByContractIdOrderByStt(id);
        return ResponseEntity.ok(deductions);
    }

    // END CONTRACT BEFORE END DATE
    // -----------------------------
    @PutMapping("/{id}/end")
    public ResponseEntity<?> endContract(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            FulltimeContract contract = fulltimeContractRepository.findById(id).orElse(null);
            if (contract == null) {
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "Contract not found"));
            }

            Long employeeId = contract.getEmployeeId();
            LocalDate startDate = contract.getStartDate();
            
            // Parse the provided end date or use today
            LocalDate endDate = LocalDate.now();
            if (body.containsKey("endDate") && body.get("endDate") != null && !body.get("endDate").isEmpty()) {
                try {
                    endDate = LocalDate.parse(body.get("endDate"));
                } catch (Exception e) {
                    // Use today if parsing fails
                }
            }

            // Validate: end date must be after or equal to start date
            // The DB constraint requires: start_date < end_date OR end_date IS NULL
            // So we need endDate to be strictly after startDate
            if (startDate != null && !endDate.isAfter(startDate)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false, 
                    "message", "End date must be after the contract start date (" + startDate + ")"
                ));
            }

            // Update contract end date
            contract.setEndDate(endDate);
            fulltimeContractRepository.save(contract);

            System.out.println("Contract " + id + " ended on " + endDate + " for employee " + employeeId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Contract ended successfully",
                "contractId", id,
                "employeeId", employeeId,
                "newEndDate", endDate
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Error ending contract: " + e.getMessage()));
        }
    }

    // CHECK IF EMPLOYEE HAS UNPAID PAYSLIPS (before ending contract)
    // ---------------------------------------------------------------
    @GetMapping("/{contractId}/employee/unpaid-payslips")
    public ResponseEntity<?> checkEmployeeUnpaidPayslips(@PathVariable Long contractId) {
        try {
            FulltimeContract contract = fulltimeContractRepository.findById(contractId).orElse(null);
            if (contract == null) {
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "Contract not found"));
            }

            Long employeeId = contract.getEmployeeId();
            
            // Check if employee has unpaid payslips
            List<Map<String, Object>> unpaidRecords = payrollRepository.findUnpaidPayrollByEmployeeId(employeeId);
            
            boolean hasUnpaid = unpaidRecords != null && !unpaidRecords.isEmpty();
            int unpaidCount = unpaidRecords != null ? unpaidRecords.size() : 0;
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "hasUnpaidPayslips", hasUnpaid,
                "unpaidCount", unpaidCount,
                "employeeId", employeeId
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Error checking payslips: " + e.getMessage()));
        }
    }

}
