package com.example.demo.repository;

import com.example.demo.entity.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    // =========================================================================
    // 1. DASHBOARD & REPORTING (Lấy dữ liệu tổng hợp cho bảng lương)
    // =========================================================================
    @Query(value = """
                SELECT DISTINCT ON (e.id)
                    e.id as employeeId,
                    CONCAT(e.f_name, ' ', e.l_name) as fullName,
                    'Engineering' as department,
                    e.type as role,
                    ROUND(COALESCE(fp.gross_salary, flp.final_amount, 0), -3) as grossPay,
                    ROUND(COALESCE(fp.net_salary, flp.final_amount, 0), -3) as netPay,
                    COALESCE(p.status, 'Unpaid') as status,
                    CAST(p.created_at AS DATE) as paymentDate,
                    COALESCE(fp.payslip_id, flp.payslip_id) as payslipId,
                    UPPER(e.type) as contractType,
                    p.id as payrollId
                FROM employee_account e
                LEFT JOIN payroll p ON p.month = :month AND p.year = :year
                LEFT JOIN fulltime_payslip fp ON p.id = fp.payroll_id AND fp.employee_id = e.id
                LEFT JOIN freelance_payslip flp ON p.id = flp.payroll_id AND flp.employee_id = e.id
                WHERE
                    e.status = 'Active'
                    AND (
                        e.type = 'Fulltime'
                        OR
                        (e.type = 'Freelance' AND EXISTS (
                            SELECT * FROM freelance_contract fc
                            WHERE fc.employee_id = e.id
                            AND EXTRACT(MONTH FROM fc.end_date) = :month
                            AND EXTRACT(YEAR FROM fc.end_date) = :year
                        ))
                    )
                ORDER BY e.id, p.created_at DESC
            """, nativeQuery = true)
    List<Object[]> findPayrollSummary(@Param("month") int month, @Param("year") int year);

    // =========================================================================
    // 2. FREELANCE PAYSLIP GENERATION (Khớp với SQL mới)
    // =========================================================================
    @Modifying
    @Transactional
    @Query(value = "CALL sp_generate_freelance_payslip(" +
            "CAST(:payrollId AS INTEGER), " +
            "CAST(:empId AS INTEGER), " +
            "CAST(:adjustmentsJson AS jsonb))", nativeQuery = true)
    void generateFreelancePayslip(
            @Param("payrollId") Long payrollId,
            @Param("empId") Integer empId,
            @Param("adjustmentsJson") String adjustmentsJson);
    // JSON String format: {"bonuses": ["Name1"], "penalties": ["Name2"]}

    // =========================================================================
    // 3. PAYROLL PERIOD MANAGEMENT (Quản lý kỳ lương)
    // =========================================================================

    // Tìm ID kỳ lương theo tháng/năm (Để check xem đã tạo chưa)
    @Query(value = "SELECT id FROM payroll WHERE month = :month AND year = :year LIMIT 1", nativeQuery = true)
    Optional<Long> findPayrollIdByMonthYear(@Param("month") int month, @Param("year") int year);

    // Tạo kỳ lương mới (Nếu không muốn dùng save() của JPA)
    @Modifying
    @Transactional
    @Query(value = "INSERT INTO payroll (month, year, period_start, period_end, status) " +
            "VALUES (:month, :year, :start, :end, 'Unpaid')", nativeQuery = true)
    void createPayrollPeriod(@Param("month") int month,
            @Param("year") int year,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Modifying
    @Transactional
    @Query("UPDATE Payroll p SET p.status = :status WHERE p.id = :id")
    void updateStatus(@Param("id") Long id, @Param("status") String status);

    // =========================================================================
    // 4. UNPAID SALARY CHECK (Kiểm tra lương chưa thanh toán trước khi Inactivate)
    // =========================================================================
    @Query(value = """
            SELECT
                p.id as "id",
                p.month as "month",
                p.year as "year",
                p.status as "status",
                CAST(p.period_start AS TEXT) as "periodStart",
                CAST(p.period_end AS TEXT) as "periodEnd"
            FROM payroll p
            LEFT JOIN fulltime_payslip fp ON p.id = fp.payroll_id
            LEFT JOIN freelance_payslip flp ON p.id = flp.payroll_id
            WHERE p.status = 'Unpaid'
            AND (fp.employee_id = :employeeId OR flp.employee_id = :employeeId)
            """, nativeQuery = true)
    List<Map<String, Object>> findUnpaidPayrollByEmployeeId(@Param("employeeId") Long employeeId);
}