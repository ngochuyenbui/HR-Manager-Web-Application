package com.example.demo.repository;

import com.example.demo.entity.subtable.FulltimeContractBonus;
import com.example.demo.entity.subtable.ContractComponentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FulltimeContractBonusRepository extends JpaRepository<FulltimeContractBonus, ContractComponentId> {
    List<FulltimeContractBonus> findByContractIdOrderByStt(Long contractId);
}
