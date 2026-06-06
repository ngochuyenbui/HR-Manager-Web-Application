package com.example.demo.repository;

import com.example.demo.dto.PayslipHistoryDTO;
import com.example.demo.entity.FulltimePayslip;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface FulltimePayslipRepository extends JpaRepository<FulltimePayslip, Long> {

    // --- 1. CALL STORED PROCEDURE (CORE LOGIC) ---
    @Modifying
    @Transactional
    @Query(value = "CALL sp_generate_fulltime_payslip(" +
            ":payrollId, " +
            ":employeeId, " +
            ":actualWorkDays, " +
            ":otHours, " +
            "CAST(:manualBonus AS jsonb), " + // Cast String -> JSONB
            "CAST(:manualPenalty AS jsonb))", // Cast String -> JSONB
            nativeQuery = true)
    void generatePayslip(
            @Param("payrollId") Long payrollId,
            @Param("employeeId") Long employeeId,
            @Param("actualWorkDays") BigDecimal actualWorkDays, // Đã đổi sang BigDecimal
            @Param("otHours") BigDecimal otHours,
            @Param("manualBonus") String manualBonus,
            @Param("manualPenalty") String manualPenalty);

    // Tìm payslip mới nhất vừa tạo để trả về UI
    FulltimePayslip findTopByPayrollIdAndEmployeeIdOrderByPayslipIdDesc(Long payrollId, Long employeeId);

    // --- 2. REPORTING QUERIES (HISTORY & LATEST) ---
    // (Giữ nguyên code Native Query của bạn ở đây, code bạn đã viết Tốt)
    @Query(value = """
                SELECT
                    p.month as "month",
                    p.year as "year",
                    (CAST(p.month AS TEXT) || '/' || CAST(p.year AS TEXT)) as "monthYear",
                    fp.net_salary as "netPay",
                    p.status as "status"
                FROM fulltime_payslip fp
                JOIN payroll p ON fp.payroll_id = p.id
                WHERE fp.employee_id = :empId
                ORDER BY p.year DESC, p.month DESC
                LIMIT 5 OFFSET 1
            """, nativeQuery = true)
    List<PayslipHistoryDTO> findHistory(@Param("empId") Long empId);

    @Query(value = """
                SELECT
                    p.month as "month",
                    p.year as "year",
                    (CAST(p.month AS TEXT) || '/' || CAST(p.year AS TEXT)) as "monthYear",
                    fp.net_salary as "netPay",
                    p.status as "status"
                FROM fulltime_payslip fp
                JOIN payroll p ON fp.payroll_id = p.id
                WHERE fp.employee_id = :empId
                ORDER BY p.year DESC, p.month DESC
                LIMIT 1
            """, nativeQuery = true)
    List<PayslipHistoryDTO> findLatest(@Param("empId") Long empId);

    @Modifying
    @Transactional
    void deleteByEmployeeId(Long employeeId);
}