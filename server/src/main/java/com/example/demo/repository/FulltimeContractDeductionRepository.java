package com.example.demo.repository;

import com.example.demo.entity.subtable.FulltimeContractDeduction;
import com.example.demo.entity.subtable.ContractComponentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FulltimeContractDeductionRepository extends JpaRepository<FulltimeContractDeduction, ContractComponentId> {
    List<FulltimeContractDeduction> findByContractIdOrderByStt(Long contractId);
}
