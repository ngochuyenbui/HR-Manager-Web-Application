package com.example.demo.controller;

import java.math.BigDecimal;
import java.nio.file.*;
import java.io.*;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import com.example.demo.entity.Employee;
import com.example.demo.repository.EmployeeRepository;
import com.example.demo.repository.PayrollRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.demo.dto.EmployeeCreationRequest;
import com.example.demo.dto.PayslipHistoryDTO;
import com.example.demo.entity.FulltimeContract;
import com.example.demo.entity.FreelanceContract;
import com.example.demo.repository.FulltimeContractRepository;
import com.example.demo.repository.FreelanceContractRepository;
import com.example.demo.repository.FulltimePayslipRepository;
import com.example.demo.repository.FreelancePayslipRepository;
import com.example.demo.repository.FulltimeContractAllowanceRepository;
import com.example.demo.repository.FulltimeContractBonusRepository;
import com.example.demo.repository.FulltimeContractDeductionRepository;
import com.example.demo.entity.subtable.FulltimeContractAllowance;
import com.example.demo.entity.subtable.FulltimeContractBonus;
import com.example.demo.entity.subtable.FulltimeContractDeduction;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.web.bind.annotation.RequestPart;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.io.InputStream;
import java.util.stream.Stream;
import java.nio.file.attribute.FileTime;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "*")
public class EmployeeController {

    @Autowired
    private EmployeeRepository employeeRepository;
    @Autowired
    private PayrollRepository payrollRepository;
    @Autowired
    private FulltimeContractRepository fulltimeContractRepository;
    @Autowired
    private FulltimeContractAllowanceRepository fulltimeContractAllowanceRepository;
    @Autowired
    private FulltimeContractBonusRepository fulltimeContractBonusRepository;
    @Autowired
    private FulltimeContractDeductionRepository fulltimeContractDeductionRepository;
    @Autowired
    private FreelanceContractRepository freelanceContractRepository;

    @Autowired
    private FulltimePayslipRepository fulltimeRepo;

    @Autowired
    private FreelancePayslipRepository freelanceRepo;

    @Value("${app.upload-dir:uploads}")
    private String uploadBaseDir;

    @GetMapping
    public List<Employee> getAll() {
        return employeeRepository.findAll();
    }

    // Check if employee has unpaid salaries (must be before generic /{id} to match
    // correctly)
    @GetMapping("/{id}/has-unpaid-salary")
    public ResponseEntity<?> hasUnpaidSalary(@PathVariable Long id) {
        try {
            System.out.println("hasUnpaidSalary called with employeeId: " + id);
            // Ensure employee exists
            if (!employeeRepository.existsById(id)) {
                System.out.println("Employee not found with id: " + id);
                return ResponseEntity.notFound().build();
            }

            // Query: Check if employee has any unpaid payroll records
            // A payroll record is unpaid if status = 'Unpaid'
            List<Map<String, Object>> unpaidRecords = payrollRepository.findUnpaidPayrollByEmployeeId(id);
            System.out.println("Found unpaid records: " + (unpaidRecords != null ? unpaidRecords.size() : 0));

            boolean hasUnpaid = unpaidRecords != null && !unpaidRecords.isEmpty();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "hasUnpaidSalary", hasUnpaid,
                    "unpaidCount", hasUnpaid ? unpaidRecords.size() : 0,
                    "message", hasUnpaid ? "Employee has unpaid salary" : "All salary paid"));
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("Error in hasUnpaidSalary: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public Employee getById(@PathVariable Long id) {
        return employeeRepository.findById(id).orElse(null);
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<?> getEmployeeProfile(@PathVariable Long id) {
        // Fetch Employee
        Employee emp = employeeRepository.findById(id).orElse(null);
        if (emp == null)
            return ResponseEntity.notFound().build();

        Map<String, Object> response = new HashMap<>();

        // Map Basic Info
        Map<String, Object> info = new HashMap<>();
        info.put("ID", emp.getId());
        info.put("Name", emp.getFName() + " " + emp.getLName());
        info.put("Position", emp.getType());
        info.put("Email", emp.getEmail());
        info.put("Phone", emp.getPhone());
        info.put("Address", emp.getAddress());
        info.put("Sex", emp.getSex());
        response.put("info", info);

        // Fetch REAL Contracts (Dynamic) - include both Fulltime and Freelance
        // contracts
        List<Map<String, Object>> contractsList = new ArrayList<>();

        // Always include Fulltime contracts (if any)
        List<FulltimeContract> fContracts = fulltimeContractRepository.findByEmployeeId(id);
        if (fContracts != null) {
            for (FulltimeContract fc : fContracts) {
                Map<String, Object> contractMap = new HashMap<>();
                contractMap.put("FullCon_ID", fc.getContractId());
                contractMap.put("StartDate", fc.getStartDate());
                contractMap.put("EndDate", fc.getEndDate());
                contractMap.put("BaseSalary", fc.getBaseSalary());
                contractMap.put("Type", fc.getType());
                contractMap.put("DocumentPath", fc.getDocumentPath());
                contractMap.put("Status", "Active");
                contractsList.add(contractMap);
            }
        }

        // Also include Freelance contracts (if any)
        List<FreelanceContract> flContracts = freelanceContractRepository.findByEmployeeId(id);
        if (flContracts != null) {
            for (FreelanceContract flc : flContracts) {
                Map<String, Object> contractMap = new HashMap<>();
                contractMap.put("FullCon_ID", flc.getContractId());
                contractMap.put("StartDate", flc.getStartDate());
                contractMap.put("EndDate", flc.getEndDate());
                contractMap.put("BaseSalary", flc.getValue());
                contractMap.put("DocumentPath", flc.getDocumentPath());
                contractMap.put("Type", "Project");
                contractMap.put("Status", "Active");
                contractsList.add(contractMap);
            }
        }

        response.put("contracts", contractsList);

        List<PayslipHistoryDTO> latestPayslip = new ArrayList<>();

        // Kiểm tra xem nhân viên là Fulltime hay Freelance để gọi đúng Repo
        if ("Fulltime".equalsIgnoreCase(emp.getType())) {
            List<PayslipHistoryDTO> ftLatest = fulltimeRepo.findLatest(id);
            if (ftLatest != null && !ftLatest.isEmpty()) {
                latestPayslip.addAll(ftLatest);
            }
        } else { // Freelance
            List<PayslipHistoryDTO> flLatest = freelanceRepo.findLatest(id);
            if (flLatest != null && !flLatest.isEmpty()) {
                latestPayslip.addAll(flLatest);
            }
        }
        response.put("payslips", latestPayslip);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEmployee(@PathVariable Long id, @RequestBody Map<String, String> updates) {
        try {
            Employee emp = employeeRepository.findById(id).orElse(null);
            if (emp == null) {
                return ResponseEntity.notFound().build();
            }

            System.out.println("Received updates: " + updates);

            // Update fields if they exist in the request
            if (updates.containsKey("Name")) {
                String fullName = updates.get("Name").trim();
                String[] names = fullName.split("\\s+"); // Split by whitespace

                if (names.length > 0) {
                    emp.setFName(names[0]); // First word is First Name
                }

                if (names.length == 1) {
                    emp.setMName(null);
                    emp.setLName("");
                } else if (names.length == 2) {
                    emp.setMName(null);
                    emp.setLName(names[1]);
                } else {
                    String middleName = "";
                    for (int i = 1; i < names.length - 1; i++) {
                        middleName += names[i] + " ";
                    }
                    emp.setMName(middleName.trim());
                    emp.setLName(names[names.length - 1]);
                }
            }
            if (updates.containsKey("Phone")) {
                emp.setPhone(updates.get("Phone"));
            }
            if (updates.containsKey("Email")) {
                emp.setEmail(updates.get("Email"));
            }
            if (updates.containsKey("Address")) {
                emp.setAddress(updates.get("Address"));
            }
            if (updates.containsKey("Position")) {
                emp.setType(updates.get("Position"));
            }
            if (updates.containsKey("Status")) {
                emp.setStatus(updates.get("Status"));
            }

            System.out.println("About to save employee: " + emp);

            employeeRepository.save(emp);

            return ResponseEntity.ok(Map.of("success", true, "message", "Profile updated successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // Dedicated endpoint to update only the status field to avoid touching
    // enum-mapped columns
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateEmployeeStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String newStatus = null;
            if (body.containsKey("status"))
                newStatus = body.get("status");
            if (newStatus == null && body.containsKey("Status"))
                newStatus = body.get("Status");
            if (newStatus == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "status is required"));
            }
            // Ensure employee exists
            if (!employeeRepository.existsById(id))
                return ResponseEntity.notFound().build();
            // Use native repository update that casts the string to the DB enum type
            employeeRepository.updateStatusByIdNative(id, newStatus);
            return ResponseEntity.ok(Map.of("success", true, "message", "Status updated"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createEmployee(@RequestBody EmployeeCreationRequest request) {
        try {
            Employee emp = new Employee();
            emp.setFName(request.getFName());
            emp.setLName(request.getLName());
            emp.setSex(request.getSex());
            emp.setPhone(request.getPhone());
            emp.setEmail(request.getEmail());
            emp.setAddress(request.getAddress());
            emp.setDob(request.getDob());
            emp.setType(request.getType());
            emp.setStatus("Active");
            emp.setUsername(request.getUsername());
            emp.setPassword(request.getPassword());
            emp.setBankAccountNumber(request.getBankAccountNumber());

            // Validate contract payload before persisting contracts to avoid DB constraint
            // errors
            Employee savedEmp = employeeRepository.save(emp);

            if ("Fulltime".equalsIgnoreCase(request.getType())) {
                if (request.getContract() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "contract is required for Fulltime employee"));
                }
                if (request.getContract().getStartDate() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "startDate is required for Fulltime contract"));
                }
                if (request.getContract().getBaseSalary() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "baseSalary is required for Fulltime contract"));
                }

                FulltimeContract contract = new FulltimeContract();
                contract.setEmployeeId(savedEmp.getId());
                contract.setStartDate(request.getContract().getStartDate());
                contract.setEndDate(request.getContract().getEndDate());
                contract.setBaseSalary(BigDecimal.valueOf(request.getContract().getBaseSalary()));
                contract.setOtRate(BigDecimal.valueOf(request.getContract().getOtRate()));
                contract.setAnnualLeaveDays(request.getContract().getAnnualLeaveDays());
                contract.setType(request.getContract().getContractType());
                FulltimeContract savedContract = fulltimeContractRepository.save(contract);
                // Persist optional sub-components if provided in creation request
                if (request.getContract().getAllowances() != null) {
                    int stt = 1;
                    for (var a : request.getContract().getAllowances()) {
                        FulltimeContractAllowance fa = new FulltimeContractAllowance();
                        fa.setContractId(savedContract.getContractId());
                        fa.setStt(stt++);
                        fa.setName(a.getName());
                        try {
                            fa.setAmount(new java.math.BigDecimal(String.valueOf(a.getAmount())));
                        } catch (Exception ex) {
                            fa.setAmount(null);
                        }
                        fulltimeContractAllowanceRepository.save(fa);
                    }
                }
                if (request.getContract().getBonuses() != null) {
                    int stt = 1;
                    for (var b : request.getContract().getBonuses()) {
                        FulltimeContractBonus fb = new FulltimeContractBonus();
                        fb.setContractId(savedContract.getContractId());
                        fb.setStt(stt++);
                        fb.setName(b.getName());
                        try {
                            fb.setAmount(new java.math.BigDecimal(String.valueOf(b.getAmount())));
                        } catch (Exception ex) {
                            fb.setAmount(null);
                        }
                        fulltimeContractBonusRepository.save(fb);
                    }
                }
                if (request.getContract().getDeductions() != null) {
                    int stt = 1;
                    for (var d : request.getContract().getDeductions()) {
                        FulltimeContractDeduction fd = new FulltimeContractDeduction();
                        fd.setContractId(savedContract.getContractId());
                        fd.setStt(stt++);
                        fd.setName(d.getName());
                        try {
                            fd.setAmount(new java.math.BigDecimal(String.valueOf(d.getAmount())));
                        } catch (Exception ex) {
                            fd.setAmount(null);
                        }
                        fulltimeContractDeductionRepository.save(fd);
                    }
                }

            } else if ("Freelance".equalsIgnoreCase(request.getType())) {
                if (request.getContract() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "contract is required for Freelance employee"));
                }
                if (request.getContract().getStartDate() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "startDate is required for Freelance contract"));
                }
                if (request.getContract().getEndDate() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "endDate is required for Freelance contract"));
                }
                if (request.getContract().getContractValue() == null) {
                    return ResponseEntity.badRequest().body(
                            Map.of("success", false, "message", "contractValue is required for Freelance contract"));
                }

                FreelanceContract contract = new FreelanceContract();
                contract.setEmployeeId(savedEmp.getId());
                contract.setStartDate(request.getContract().getStartDate());
                contract.setEndDate(request.getContract().getEndDate());
                contract.setValue(BigDecimal.valueOf(request.getContract().getContractValue()));
                contract.setCommittedDeadline(request.getContract().getCommittedDeadline());

                freelanceContractRepository.save(contract);
            }
            return ResponseEntity
                    .ok(Map.of("success", true, "message", "Employee and Contract created!", "id", savedEmp.getId()));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/contracts")
    public ResponseEntity<?> addContractToEmployee(@PathVariable Long id, @RequestBody Map<String, Object> contract) {
        try {
            System.out.println("Received contract payload for employee " + id + ": " + contract);
            Employee emp = employeeRepository.findById(id).orElse(null);
            if (emp == null)
                return ResponseEntity.notFound().build();

            // Heuristic detection for contract kind based on payload fields
            boolean payloadLooksLikeFulltime = false;
            boolean payloadLooksLikeFreelance = false;
            if (contract.get("baseSalary") != null || contract.get("otRate") != null
                    || contract.get("annualLeaveDays") != null || contract.get("contractType") != null) {
                payloadLooksLikeFulltime = true;
            }
            if (contract.get("contractValue") != null || contract.get("committedDeadline") != null) {
                payloadLooksLikeFreelance = true;
            }

            // If employee is currently Freelance but incoming contract is Fulltime, convert
            // employee type
            if (payloadLooksLikeFulltime && !"Fulltime".equalsIgnoreCase(emp.getType())) {
                // Use native update to change only the `type` column and avoid writing other
                // enum-mapped columns
                employeeRepository.updateTypeByIdNative(id, "Fulltime");
                System.out.println("Converted employee " + id + " type to Fulltime due to incoming contract.");
                // Also update the in-memory entity so subsequent logic treats this employee as
                // Fulltime
                emp.setType("Fulltime");
            }

            // Choose branch based primarily on payload detection; fallback to employee.type
            // when ambiguous
            if (payloadLooksLikeFulltime) {
                FulltimeContract fc = new FulltimeContract();
                fc.setEmployeeId(id);
                // Parse dates/numbers defensively
                if (contract.get("startDate") != null) {
                    LocalDate d = parseDateSafe(contract.get("startDate"));
                    if (d != null)
                        fc.setStartDate(d);
                }
                if (contract.get("endDate") != null) {
                    LocalDate d = parseDateSafe(contract.get("endDate"));
                    if (d != null)
                        fc.setEndDate(d);
                }
                BigDecimal baseSalary = parseBigDecimalSafe(contract.get("baseSalary"));
                if (baseSalary != null)
                    fc.setBaseSalary(baseSalary);
                // Validate required fields for Fulltime
                if (fc.getStartDate() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "startDate is required for Fulltime contract"));
                }
                if (fc.getBaseSalary() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "baseSalary is required for Fulltime contract"));
                }
                BigDecimal ot = parseBigDecimalSafe(contract.get("otRate"));
                if (ot != null)
                    fc.setOtRate(ot);
                Integer al = parseIntegerSafe(contract.get("annualLeaveDays"));
                if (al != null)
                    fc.setAnnualLeaveDays(al);
                if (contract.get("contractType") != null)
                    fc.setType(String.valueOf(contract.get("contractType")));
                FulltimeContract savedFc = fulltimeContractRepository.save(fc);
                // Save allowances/bonuses/deductions if present in payload
                try {
                    Object rawAllowances = contract.get("allowances");
                    if (rawAllowances instanceof java.util.List) {
                        int stt = 1;
                        for (Object o : (java.util.List) rawAllowances) {
                            if (o instanceof java.util.Map) {
                                java.util.Map m = (java.util.Map) o;
                                FulltimeContractAllowance fa = new FulltimeContractAllowance();
                                fa.setContractId(savedFc.getContractId());
                                fa.setStt(stt++);
                                fa.setName(m.getOrDefault("name", "").toString());
                                try {
                                    fa.setAmount(
                                            new java.math.BigDecimal(String.valueOf(m.getOrDefault("amount", null))));
                                } catch (Exception ex) {
                                    fa.setAmount(null);
                                }
                                fulltimeContractAllowanceRepository.save(fa);
                            }
                        }
                    }
                } catch (Exception ex) {
                    /* ignore non-critical subcomponent errors */ }
                try {
                    Object rawBonuses = contract.get("bonuses");
                    if (rawBonuses instanceof java.util.List) {
                        int stt = 1;
                        for (Object o : (java.util.List) rawBonuses) {
                            if (o instanceof java.util.Map) {
                                java.util.Map m = (java.util.Map) o;
                                FulltimeContractBonus fb = new FulltimeContractBonus();
                                fb.setContractId(savedFc.getContractId());
                                fb.setStt(stt++);
                                fb.setName(m.getOrDefault("name", "").toString());
                                try {
                                    fb.setAmount(
                                            new java.math.BigDecimal(String.valueOf(m.getOrDefault("amount", null))));
                                } catch (Exception ex) {
                                    fb.setAmount(null);
                                }
                                fulltimeContractBonusRepository.save(fb);
                            }
                        }
                    }
                } catch (Exception ex) {
                }
                try {
                    Object rawDeductions = contract.get("deductions");
                    if (rawDeductions instanceof java.util.List) {
                        int stt = 1;
                        for (Object o : (java.util.List) rawDeductions) {
                            if (o instanceof java.util.Map) {
                                java.util.Map m = (java.util.Map) o;
                                FulltimeContractDeduction fd = new FulltimeContractDeduction();
                                fd.setContractId(savedFc.getContractId());
                                fd.setStt(stt++);
                                fd.setName(m.getOrDefault("name", "").toString());
                                try {
                                    fd.setAmount(
                                            new java.math.BigDecimal(String.valueOf(m.getOrDefault("amount", null))));
                                } catch (Exception ex) {
                                    fd.setAmount(null);
                                }
                                fulltimeContractDeductionRepository.save(fd);
                            }
                        }
                    }
                } catch (Exception ex) {
                }
            } else if (payloadLooksLikeFreelance) {
                FreelanceContract fl = new FreelanceContract();
                fl.setEmployeeId(id);
                if (contract.get("startDate") != null) {
                    LocalDate d = parseDateSafe(contract.get("startDate"));
                    if (d != null)
                        fl.setStartDate(d);
                }
                if (contract.get("endDate") != null) {
                    LocalDate d = parseDateSafe(contract.get("endDate"));
                    if (d != null)
                        fl.setEndDate(d);
                }
                BigDecimal val = parseBigDecimalSafe(contract.get("contractValue"));
                if (val != null)
                    fl.setValue(val);
                // Validate required fields for Freelance
                if (fl.getStartDate() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "startDate is required for Freelance contract"));
                }
                if (fl.getEndDate() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "endDate is required for Freelance contract"));
                }
                if (fl.getValue() == null) {
                    return ResponseEntity.badRequest().body(
                            Map.of("success", false, "message", "contractValue is required for Freelance contract"));
                }
                if (contract.get("committedDeadline") != null) {
                    LocalDate d = parseDateSafe(contract.get("committedDeadline"));
                    if (d != null)
                        fl.setCommittedDeadline(d);
                }
                freelanceContractRepository.save(fl);
            } else {
                // Fallback: if payload is ambiguous, use employee.type to decide
                if ("Fulltime".equalsIgnoreCase(emp.getType())) {
                    FulltimeContract fc = new FulltimeContract();
                    fc.setEmployeeId(id);
                    if (contract.get("startDate") != null) {
                        LocalDate d = parseDateSafe(contract.get("startDate"));
                        if (d != null)
                            fc.setStartDate(d);
                    }
                    if (contract.get("endDate") != null) {
                        LocalDate d = parseDateSafe(contract.get("endDate"));
                        if (d != null)
                            fc.setEndDate(d);
                    }
                    BigDecimal baseSalary = parseBigDecimalSafe(contract.get("baseSalary"));
                    if (baseSalary != null)
                        fc.setBaseSalary(baseSalary);
                    if (fc.getStartDate() == null) {
                        return ResponseEntity.badRequest().body(
                                Map.of("success", false, "message", "startDate is required for Fulltime contract"));
                    }
                    if (fc.getBaseSalary() == null) {
                        return ResponseEntity.badRequest().body(
                                Map.of("success", false, "message", "baseSalary is required for Fulltime contract"));
                    }
                    BigDecimal ot = parseBigDecimalSafe(contract.get("otRate"));
                    if (ot != null)
                        fc.setOtRate(ot);
                    Integer al = parseIntegerSafe(contract.get("annualLeaveDays"));
                    if (al != null)
                        fc.setAnnualLeaveDays(al);
                    if (contract.get("contractType") != null)
                        fc.setType(String.valueOf(contract.get("contractType")));
                    fulltimeContractRepository.save(fc);
                } else {
                    FreelanceContract fl = new FreelanceContract();
                    fl.setEmployeeId(id);
                    if (contract.get("startDate") != null) {
                        LocalDate d = parseDateSafe(contract.get("startDate"));
                        if (d != null)
                            fl.setStartDate(d);
                    }
                    if (contract.get("endDate") != null) {
                        LocalDate d = parseDateSafe(contract.get("endDate"));
                        if (d != null)
                            fl.setEndDate(d);
                    }
                    BigDecimal val = parseBigDecimalSafe(contract.get("contractValue"));
                    if (val != null)
                        fl.setValue(val);
                    if (fl.getStartDate() == null) {
                        return ResponseEntity.badRequest().body(
                                Map.of("success", false, "message", "startDate is required for Freelance contract"));
                    }
                    if (fl.getEndDate() == null) {
                        return ResponseEntity.badRequest().body(
                                Map.of("success", false, "message", "endDate is required for Freelance contract"));
                    }
                    if (fl.getValue() == null) {
                        return ResponseEntity.badRequest().body(Map.of("success", false, "message",
                                "contractValue is required for Freelance contract"));
                    }
                    if (contract.get("committedDeadline") != null) {
                        LocalDate d = parseDateSafe(contract.get("committedDeadline"));
                        if (d != null)
                            fl.setCommittedDeadline(d);
                    }
                    freelanceContractRepository.save(fl);
                }
            }

            return ResponseEntity.ok(Map.of("success", true, "message", "Contract added."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/contracts-with-file")
    public ResponseEntity<?> addContractWithFile(@PathVariable Long id,
            @RequestPart("payload") String payloadJson,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> contract = mapper.readValue(payloadJson, new TypeReference<Map<String, Object>>() {
            });

            // Save file if provided
            String storedPath = null;
            if (file != null && !file.isEmpty()) {
                Path uploadDir = Paths.get(uploadBaseDir, "contracts");
                Files.createDirectories(uploadDir);
                String cleaned = StringUtils.cleanPath(file.getOriginalFilename());
                String filename = System.currentTimeMillis() + "_" + cleaned;
                Path target = uploadDir.resolve(filename);
                try (InputStream in = file.getInputStream()) {
                    Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
                }
                storedPath = target.toString();
                System.out.println("Saved uploaded file: " + storedPath);
            }

            // Reuse the same heuristics as the JSON-only endpoint
            Employee emp = employeeRepository.findById(id).orElse(null);
            if (emp == null)
                return ResponseEntity.notFound().build();

            boolean payloadLooksLikeFulltime = false;
            boolean payloadLooksLikeFreelance = false;
            if (contract.get("baseSalary") != null || contract.get("otRate") != null
                    || contract.get("annualLeaveDays") != null || contract.get("contractType") != null) {
                payloadLooksLikeFulltime = true;
            }
            if (contract.get("contractValue") != null || contract.get("committedDeadline") != null) {
                payloadLooksLikeFreelance = true;
            }

            if (payloadLooksLikeFulltime && !"Fulltime".equalsIgnoreCase(emp.getType())) {
                employeeRepository.updateTypeByIdNative(id, "Fulltime");
                emp.setType("Fulltime");
            }

            if (payloadLooksLikeFulltime) {
                FulltimeContract fc = new FulltimeContract();
                fc.setEmployeeId(id);
                if (contract.get("startDate") != null) {
                    LocalDate d = parseDateSafe(contract.get("startDate"));
                    if (d != null)
                        fc.setStartDate(d);
                }
                if (contract.get("endDate") != null) {
                    LocalDate d = parseDateSafe(contract.get("endDate"));
                    if (d != null)
                        fc.setEndDate(d);
                }
                BigDecimal baseSalary = parseBigDecimalSafe(contract.get("baseSalary"));
                if (baseSalary != null)
                    fc.setBaseSalary(baseSalary);
                if (fc.getStartDate() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "startDate is required for Fulltime contract"));
                }
                if (fc.getBaseSalary() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "baseSalary is required for Fulltime contract"));
                }
                BigDecimal ot = parseBigDecimalSafe(contract.get("otRate"));
                if (ot != null)
                    fc.setOtRate(ot);
                Integer al = parseIntegerSafe(contract.get("annualLeaveDays"));
                if (al != null)
                    fc.setAnnualLeaveDays(al);
                if (contract.get("contractType") != null)
                    fc.setType(String.valueOf(contract.get("contractType")));
                if (storedPath != null)
                    fc.setDocumentPath(storedPath);
                fulltimeContractRepository.save(fc);
            } else if (payloadLooksLikeFreelance) {
                FreelanceContract fl = new FreelanceContract();
                fl.setEmployeeId(id);
                if (contract.get("startDate") != null) {
                    LocalDate d = parseDateSafe(contract.get("startDate"));
                    if (d != null)
                        fl.setStartDate(d);
                }
                if (contract.get("endDate") != null) {
                    LocalDate d = parseDateSafe(contract.get("endDate"));
                    if (d != null)
                        fl.setEndDate(d);
                }
                BigDecimal val = parseBigDecimalSafe(contract.get("contractValue"));
                if (val != null)
                    fl.setValue(val);
                if (fl.getStartDate() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "startDate is required for Freelance contract"));
                }
                if (fl.getEndDate() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "endDate is required for Freelance contract"));
                }
                if (fl.getValue() == null) {
                    return ResponseEntity.badRequest().body(
                            Map.of("success", false, "message", "contractValue is required for Freelance contract"));
                }
                if (contract.get("committedDeadline") != null) {
                    LocalDate d = parseDateSafe(contract.get("committedDeadline"));
                    if (d != null)
                        fl.setCommittedDeadline(d);
                }
                if (storedPath != null)
                    fl.setDocumentPath(storedPath);
                freelanceContractRepository.save(fl);
            } else {
                // fallback to employee.type
                if ("Fulltime".equalsIgnoreCase(emp.getType())) {
                    FulltimeContract fc = new FulltimeContract();
                    fc.setEmployeeId(id);
                    if (contract.get("startDate") != null) {
                        LocalDate d = parseDateSafe(contract.get("startDate"));
                        if (d != null)
                            fc.setStartDate(d);
                    }
                    if (contract.get("endDate") != null) {
                        LocalDate d = parseDateSafe(contract.get("endDate"));
                        if (d != null)
                            fc.setEndDate(d);
                    }
                    BigDecimal ot = parseBigDecimalSafe(contract.get("otRate"));
                    if (ot != null)
                        fc.setOtRate(ot);
                    Integer al = parseIntegerSafe(contract.get("annualLeaveDays"));
                    if (al != null)
                        fc.setAnnualLeaveDays(al);
                    if (contract.get("contractType") != null)
                        fc.setType(String.valueOf(contract.get("contractType")));
                    if (storedPath != null)
                        fc.setDocumentPath(storedPath);
                    fulltimeContractRepository.save(fc);
                } else {
                    FreelanceContract fl = new FreelanceContract();
                    fl.setEmployeeId(id);
                    if (contract.get("startDate") != null) {
                        LocalDate d = parseDateSafe(contract.get("startDate"));
                        if (d != null)
                            fl.setStartDate(d);
                    }
                    if (contract.get("endDate") != null) {
                        LocalDate d = parseDateSafe(contract.get("endDate"));
                        if (d != null)
                            fl.setEndDate(d);
                    }
                    BigDecimal val = parseBigDecimalSafe(contract.get("contractValue"));
                    if (val != null)
                        fl.setValue(val);
                    if (fl.getStartDate() == null) {
                        return ResponseEntity.badRequest().body(
                                Map.of("success", false, "message", "startDate is required for Freelance contract"));
                    }
                    if (fl.getEndDate() == null) {
                        return ResponseEntity.badRequest().body(
                                Map.of("success", false, "message", "endDate is required for Freelance contract"));
                    }
                    if (fl.getValue() == null) {
                        return ResponseEntity.badRequest().body(Map.of("success", false, "message",
                                "contractValue is required for Freelance contract"));
                    }
                    if (contract.get("committedDeadline") != null) {
                        LocalDate d = parseDateSafe(contract.get("committedDeadline"));
                        if (d != null)
                            fl.setCommittedDeadline(d);
                    }
                    if (storedPath != null)
                        fl.setDocumentPath(storedPath);
                    freelanceContractRepository.save(fl);
                }
            }

            return ResponseEntity.ok(Map.of("success", true, "message", "Contract with file added."));
        } catch (

        Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // Helper parsing utilities
    private LocalDate parseDateSafe(Object o) {
        try {
            if (o == null)
                return null;
            String s = String.valueOf(o).trim();
            if (s.isBlank())
                return null;
            return LocalDate.parse(s);
        } catch (Exception ex) {
            System.out.println("Failed to parse date: " + o + " -> " + ex.getMessage());
            return null;
        }
    }

    private Double parseDoubleSafe(Object o) {
        try {
            if (o == null)
                return null;
            String s = String.valueOf(o).trim();
            if (s.isBlank())
                return null;
            return Double.valueOf(s);
        } catch (Exception ex) {
            System.out.println("Failed to parse double: " + o + " -> " + ex.getMessage());
            return null;
        }
    }

    private Integer parseIntegerSafe(Object o) {
        try {
            if (o == null)
                return null;
            String s = String.valueOf(o).trim();
            if (s.isBlank())
                return null;
            return Integer.valueOf(s);
        } catch (Exception ex) {
            System.out.println("Failed to parse int: " + o + " -> " + ex.getMessage());
            return null;
        }
    }

    // --- API: LẤY LỊCH SỬ LƯƠNG ---
    @GetMapping("/{id}/payslip-history")
    public ResponseEntity<List<PayslipHistoryDTO>> getPayslipHistory(@PathVariable Long id) {

        List<PayslipHistoryDTO> history = new ArrayList<>();

        // 1. Lấy dữ liệu từ bảng Fulltime
        List<PayslipHistoryDTO> ftList = fulltimeRepo.findHistory(id);
        if (ftList != null)
            history.addAll(ftList);

        // 2. Lấy dữ liệu từ bảng Freelance
        List<PayslipHistoryDTO> flList = freelanceRepo.findHistory(id);
        if (flList != null)
            history.addAll(flList);

        // 3. Sắp xếp giảm dần theo thời gian (Năm -> Tháng)
        history.sort((a, b) -> {
            int yearCompare = b.getYear().compareTo(a.getYear());
            if (yearCompare != 0)
                return yearCompare;
            return b.getMonth().compareTo(a.getMonth());
        });

        return ResponseEntity.ok(history);
    }

    // --- Utility endpoints to inspect uploaded files ---
    @GetMapping("/uploads/contracts")
    public ResponseEntity<?> listUploadedContracts() {
        Path uploadDir = Paths.get(uploadBaseDir, "contracts");
        if (!Files.exists(uploadDir)) {
            return ResponseEntity.ok(List.of());
        }
        List<Map<String, Object>> files = new ArrayList<>();
        try (Stream<Path> stream = Files.list(uploadDir)) {
            stream.forEach(p -> {
                try {
                    Map<String, Object> m = new HashMap<>();
                    m.put("filename", p.getFileName().toString());
                    m.put("path", p.toAbsolutePath().toString());
                    FileTime ft = Files.getLastModifiedTime(p);
                    m.put("lastModified", ft.toString());
                    m.put("size", Files.size(p));
                    files.add(m);
                } catch (Exception ex) {
                    // ignore single file errors
                }
            });
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/uploads/contracts/{filename:.+}")
    public ResponseEntity<Resource> downloadContract(@PathVariable String filename) {
        try {
            Path uploadDir = Paths.get(uploadBaseDir, "contracts");
            Path file = uploadDir.resolve(filename).normalize();
            if (!file.startsWith(uploadDir)) {
                return ResponseEntity.status(403).build();
            }
            if (!Files.exists(file))
                return ResponseEntity.notFound().build();
            Resource resource = new UrlResource(file.toUri());
            String disp = "attachment; filename=\"" + resource.getFilename() + "\"";
            return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, disp).body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEmployee(@PathVariable Long id) {
        try {
            // Ensure employee exists
            if (!employeeRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }

            // Delete associated contracts and payslips first to maintain referential
            // integrity
            fulltimeContractRepository.deleteByEmployeeId(id);
            freelanceContractRepository.deleteByEmployeeId(id);
            fulltimeRepo.deleteByEmployeeId(id);
            freelanceRepo.deleteByEmployeeId(id);

            // Finally delete the employee
            employeeRepository.deleteById(id);

            return ResponseEntity.ok(Map.of("success", true, "message", "Employee deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message",
                    "Failed to delete employee. This employee may have associated records that prevent deletion."));
        }
    }

    // Check and update employee status based on active contracts
    @PostMapping("/{id}/update-status-from-contracts")
    public ResponseEntity<?> updateEmployeeStatusFromContracts(@PathVariable Long id) {
        try {
            Employee emp = employeeRepository.findById(id).orElse(null);
            if (emp == null) {
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "Employee not found"));
            }

            LocalDate today = LocalDate.now();

            // Check if employee has any active fulltime contracts
            List<FulltimeContract> fulltimeContracts = fulltimeContractRepository.findByEmployeeId(id);
            boolean hasActiveFTContract = false;
            for (FulltimeContract contract : fulltimeContracts) {
                LocalDate endDate = contract.getEndDate();
                // Contract is active if end date is null (indefinite) or end date is in the
                // future
                if (endDate == null || endDate.isAfter(today)) {
                    hasActiveFTContract = true;
                    break;
                }
            }

            // Check if employee has any active freelance contracts
            List<FreelanceContract> freelanceContracts = freelanceContractRepository.findByEmployeeId(id);
            boolean hasActiveFlContract = false;
            for (FreelanceContract contract : freelanceContracts) {
                LocalDate endDate = contract.getEndDate();
                if (endDate == null || endDate.isAfter(today)) {
                    hasActiveFlContract = true;
                    break;
                }
            }

            // If no active contracts, set employee to Inactive
            String oldStatus = emp.getStatus();
            if (!hasActiveFTContract && !hasActiveFlContract) {
                emp.setStatus("Inactive");
                employeeRepository.save(emp);
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Employee status updated to Inactive (no active contracts)",
                        "oldStatus", oldStatus,
                        "newStatus", "Inactive"));
            } else {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Employee has active contracts - status remains " + oldStatus,
                        "hasActiveContracts", true,
                        "currentStatus", oldStatus));
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of("success", false, "message", "Error updating employee status: " + e.getMessage()));
        }
    }

    private BigDecimal parseBigDecimalSafe(Object obj) {
        if (obj == null)
            return null;
        try {
            return new BigDecimal(String.valueOf(obj));
        } catch (Exception e) {
            return null;
        }
    }
}