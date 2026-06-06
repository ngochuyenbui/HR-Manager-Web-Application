package com.example.demo.repository;

import com.example.demo.entity.FulltimePayslipView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FulltimePayslipViewRepository extends JpaRepository<FulltimePayslipView, Long> {
    
    // Tìm chi tiết phiếu lương của 1 nhân viên trong 1 kỳ lương cụ thể
    // Spring Data JPA sẽ tự sinh câu SQL: SELECT * FROM ... WHERE payroll_id = ? AND employee_id = ?
    Optional<FulltimePayslipView> findByPayrollIdAndEmployeeId(Long payrollId, Long employeeId);
}