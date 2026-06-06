package com.example.demo.repository;

import com.example.demo.dto.PayslipHistoryDTO;
import com.example.demo.entity.FreelancePayslip;
import com.example.demo.entity.FreelancePayslipView;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface FreelancePayslipRepository extends JpaRepository<FreelancePayslip, Long> {

    @Query(value = """
        SELECT 
            p.month as month, 
            p.year as year, 
            fp.final_amount as netPay, -- Đổi tên cột này thành netPay để khớp DTO
            p.status as status
        FROM freelance_payslip fp
        JOIN payroll p ON fp.payroll_id = p.id
        WHERE fp.employee_id = :empId
        ORDER BY p.year DESC, p.month DESC
        LIMIT 5 OFFSET 1
    """, nativeQuery = true)
    List<PayslipHistoryDTO> findHistory(@Param("empId") Long empId);

    @Query(value = """
        SELECT 
            p.month as month, 
            p.year as year, 
            fp.final_amount as netPay, 
            p.status as status
        FROM freelance_payslip fp
        JOIN payroll p ON fp.payroll_id = p.id
        WHERE fp.employee_id = :empId
        ORDER BY p.year DESC, p.month DESC
        LIMIT 1
    """, nativeQuery = true)
    List<PayslipHistoryDTO> findLatest(@Param("empId") Long empId);

    // Query Native vào SQL View để lấy dữ liệu chi tiết kèm JSON
    @Query(value = "SELECT * FROM view_freelance_payslip_detail WHERE payslip_id = :id", nativeQuery = true)
    Optional<FreelancePayslipView> findDetailView(@Param("id") Long id);

    // Hàm JPA chuẩn để tìm kiếm
    Optional<FreelancePayslip> findByPayrollIdAndEmployeeId(Long payrollId, Long employeeId);

    @Modifying
    @Transactional
    void deleteByEmployeeId(Long employeeId);
}