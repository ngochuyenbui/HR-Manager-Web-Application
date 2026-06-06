package com.example.demo.repository;
import com.example.demo.entity.FulltimeContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface FulltimeContractRepository extends JpaRepository<FulltimeContract, Long> {
    List<FulltimeContract> findByEmployeeId(Long employeeId);
    
    @Modifying
    @Transactional
    void deleteByEmployeeId(Long employeeId);
}