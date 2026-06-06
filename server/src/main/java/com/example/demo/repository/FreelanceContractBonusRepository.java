package com.example.demo.repository;

import com.example.demo.entity.subtable.FreelanceContractBonus;
import com.example.demo.entity.subtable.ContractComponentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FreelanceContractBonusRepository extends JpaRepository<FreelanceContractBonus, ContractComponentId> {
    List<FreelanceContractBonus> findByContractIdOrderByStt(Long contractId);
}
