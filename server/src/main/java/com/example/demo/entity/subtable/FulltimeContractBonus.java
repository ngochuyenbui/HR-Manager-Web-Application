package com.example.demo.entity.subtable;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "fulltime_contract_bonus")
@IdClass(ContractComponentId.class)
@Data
public class FulltimeContractBonus {
    @Id
    @Column(name = "contract_id")
    private Long contractId;

    @Id
    @Column(name = "stt")
    private Integer stt;

    @Column(name = "name")
    private String name;

    @Column(name = "amount")
    private BigDecimal amount;

    @Column(name = "rate")
    private BigDecimal rate;
}
