package com.example.demo.repository;

import com.example.demo.entity.FreelancePayslipView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FreelancePayslipViewRepository extends JpaRepository<FreelancePayslipView, Long> {

    // Tìm chi tiết phiếu lương freelance của 1 nhân viên trong 1 kỳ lương cụ thể
    // Spring Data JPA sẽ tự sinh câu SQL: SELECT * FROM
    // view_freelance_payslip_detail WHERE payroll_id = ? AND employee_id = ?
    Optional<FreelancePayslipView> findByPayrollIdAndEmployeeId(Long payrollId, Long employeeId);

    // Tìm theo payslipId (cho endpoint GET /freelance/{id})
    Optional<FreelancePayslipView> findByPayslipId(Long payslipId);
}
