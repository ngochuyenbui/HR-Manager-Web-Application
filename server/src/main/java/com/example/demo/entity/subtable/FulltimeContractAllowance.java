package com.example.demo.entity.subtable;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "fulltime_contract_allowance")
@IdClass(ContractComponentId.class)
@Data
public class FulltimeContractAllowance {
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
}
