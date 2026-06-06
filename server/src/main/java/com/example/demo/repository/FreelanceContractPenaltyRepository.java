package com.example.demo.repository;

import com.example.demo.entity.subtable.FreelanceContractPenalty;
import com.example.demo.entity.subtable.ContractComponentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FreelanceContractPenaltyRepository
        extends JpaRepository<FreelanceContractPenalty, ContractComponentId> {
    List<FreelanceContractPenalty> findByContractIdOrderByStt(Long contractId);
}
