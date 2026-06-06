package com.example.demo.entity.subtable;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "fulltime_contract_deduction")
@IdClass(ContractComponentId.class)
@Data
public class FulltimeContractDeduction {
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
