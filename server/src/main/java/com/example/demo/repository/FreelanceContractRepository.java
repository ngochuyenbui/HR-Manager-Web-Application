package com.example.demo.repository;
import com.example.demo.entity.FreelanceContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FreelanceContractRepository extends JpaRepository<FreelanceContract, Long> {
    List<FreelanceContract> findByEmployeeId(Long employeeId);

    @Query(value = "SELECT * FROM freelance_contract WHERE employee_id = :empId ORDER BY start_date DESC LIMIT 1", nativeQuery = true)
    Optional<FreelanceContract> findLatestContractByEmployeeId(@Param("empId") Long empId);

    @Query(value = """
        SELECT * FROM freelance_contract 
        WHERE employee_id = :empId 
        AND :targetDate BETWEEN start_date AND end_date
        ORDER BY start_date DESC 
        LIMIT 1
    """, nativeQuery = true)
    Optional<FreelanceContract> findValidContractAtDate(
            @Param("empId") Long empId, 
            @Param("targetDate") LocalDate targetDate
    );

    // [MỚI] Lấy danh sách Bonus của hợp đồng (Native Query để không phụ thuộc Entity mapping)
    @Query(value = "SELECT name, amount, rate FROM freelance_contract_bonus WHERE contract_id = :contractId", nativeQuery = true)
    List<Object[]> findBonusesByContractId(@Param("contractId") Long contractId);

    // [MỚI] Lấy danh sách Penalty của hợp đồng
    @Query(value = "SELECT name, amount, rate FROM freelance_contract_penalty WHERE contract_id = :contractId", nativeQuery = true)
    List<Object[]> findPenaltiesByContractId(@Param("contractId") Long contractId);

    @Modifying
    @Transactional
    void deleteByEmployeeId(Long employeeId);
}