package com.example.demo.repository;

import com.example.demo.entity.subtable.FulltimeContractAllowance;
import com.example.demo.entity.subtable.ContractComponentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FulltimeContractAllowanceRepository extends JpaRepository<FulltimeContractAllowance, ContractComponentId> {
    List<FulltimeContractAllowance> findByContractIdOrderByStt(Long contractId);
}
