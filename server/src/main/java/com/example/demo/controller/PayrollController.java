package com.example.demo.controller;

import com.example.demo.dto.FulltimePayslipCalculationRequest; // [NEW] Import DTO mới
import com.example.demo.dto.PayrollDashboardDTO;
import com.example.demo.dto.PayrollRequest;
import com.example.demo.dto.PayslipDetailDTO;
import com.example.demo.enums.BonusType;
import com.example.demo.service.PayrollService;
import com.example.demo.repository.TimesheetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payroll")
@CrossOrigin(origins = "*") // Cho phép tất cả nguồn
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;
    private final TimesheetRepository timesheetRepo;

    // =========================================================================
    // 0. METADATA: Lấy danh sách loại thưởng (Cho Dropdown FE)
    // =========================================================================
    @GetMapping("/metadata/bonus-types")
    public ResponseEntity<List<Map<String, String>>> getBonusTypes() {
        List<Map<String, String>> types = Arrays.stream(BonusType.values())
                .filter(t -> t == BonusType.HOLIDAY || t == BonusType.OTHER)
                .map(type -> Map.of("key", type.getKey(), "label", type.getLabel()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(types);
    }

    // =========================================================================
    // 1. DASHBOARD: Lấy danh sách bảng lương
    // =========================================================================
    @GetMapping
    public ResponseEntity<List<PayrollDashboardDTO>> getDashboard(
            @RequestParam(defaultValue = "11") int month,
            @RequestParam(defaultValue = "2024") int year) {

        List<PayrollDashboardDTO> dashboardData = payrollService.getPayrollDashboard(month, year);
        return ResponseEntity.ok(dashboardData);
    }

    // =========================================================================
    // 2. BULK CALCULATION: Tính lương hàng loạt (Nút "Calculate All")
    // =========================================================================
    @PostMapping("/calculate")
    public ResponseEntity<?> calculatePayroll(@RequestBody PayrollRequest request) {
        try {
            if (request.getMonth() < 1 || request.getMonth() > 12) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid month"));
            }

            payrollService.calculatePayroll(request);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message",
                    "Payroll calculation completed successfully for " + request.getMonth() + "/" + request.getYear()));

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", "Server Error: " + e.getMessage()));
        }
    }

    // =========================================================================
    // [NEW] 2.1. SINGLE CALCULATION: Tính lương 1 người (Nút "Calculate" Popup)
    // =========================================================================
    @PostMapping("/calculate/fulltime")
    public ResponseEntity<?> calculateFulltimePayslipSingle(@RequestBody FulltimePayslipCalculationRequest request) {
        try {
            // Validation cơ bản
            if (request.getEmployeeId() == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Employee ID is required"));
            }

            // Gọi Service xử lý tính toán và trả về ngay kết quả chi tiết để hiển thị lên UI
            PayslipDetailDTO result = payrollService.calculateFulltimePayslipSingle(request);
            
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // =========================================================================
    // 3. DETAIL: Xem chi tiết phiếu lương
    // =========================================================================
    @GetMapping("/{payrollId}/employee/{employeeId}")
    public ResponseEntity<?> getPayslipDetail(
            @PathVariable Long payrollId,
            @PathVariable Long employeeId) {
        try {
            PayslipDetailDTO detail = payrollService.getPayslipDetail(payrollId, employeeId);
            return ResponseEntity.ok(detail);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // =========================================================================
    // 4. LOCK: Chốt sổ kỳ lương
    // =========================================================================
    @PostMapping("/{payrollId}/lock")
    public ResponseEntity<?> lockPayroll(@PathVariable Long payrollId) {
        try {
            payrollService.lockPayroll(payrollId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Payroll locked successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // =========================================================================
    // 5. TIMESHEET SUMMARY: Lấy thông tin công/OT (Updated Logic)
    // =========================================================================
    @GetMapping("/timesheet-summary")
    public ResponseEntity<Map<String, Object>> getTimesheetSummary(
            @RequestParam Long employeeId,
            @RequestParam int month,
            @RequestParam int year) {

        Double totalHours = timesheetRepo.calculateTotalWorkedHours(employeeId, month, year);
        Double totalOT = timesheetRepo.calculateTotalOvertimeHours(employeeId, month, year);

        // [FIXED] Sửa logic: Trả về số thực (decimal) thay vì int để khớp với BigDecimal trong Service
        // Ví dụ: 172 giờ / 8 = 21.5 công (Thay vì bị ép kiểu thành 21)
        double workDays = (totalHours != null) ? totalHours / 8.0 : 0.0;
        
        // Làm tròn hiển thị cho đẹp (2 chữ số thập phân)
        BigDecimal workDaysBd = BigDecimal.valueOf(workDays).setScale(2, RoundingMode.HALF_UP);
        
        double ot = (totalOT != null) ? totalOT : 0.0;

        return ResponseEntity.ok(Map.of(
                "actualWorkDays", workDaysBd, 
                "suggestedOtHours", ot));
    }

    // =========================================================================
    // 6. FREELANCE TERMS: Lấy danh sách thưởng/phạt từ hợp đồng
    // =========================================================================
    @GetMapping("/freelance-contract-terms")
    public ResponseEntity<Map<String, List<com.example.demo.dto.FreelanceContractTerm>>> getFreelanceTerms(
            @RequestParam Long employeeId,
            @RequestParam int month,
            @RequestParam int year) {

        try {
            var terms = payrollService.getFreelanceContractTerms(employeeId, month, year);
            return ResponseEntity.ok(terms);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}