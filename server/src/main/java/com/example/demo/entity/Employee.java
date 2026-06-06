package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty; 
import java.time.LocalDate;

@Entity
@Table(name = "employee_account")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("fName") 
    @Column(name = "f_name", nullable = false)
    private String fName;

    @JsonProperty("mName")
    @Column(name = "m_name")
    private String mName;

    @JsonProperty("lName")
    @Column(name = "l_name", nullable = false)
    private String lName;
    // --- FIX ENDS HERE ---

    @Column(name = "sex", columnDefinition = "text") 
    private String sex;

    private String phone;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "bank_account_number")
    private String bankAccountNumber;

    private String address;

    private LocalDate dob;

    @Column(name = "type", nullable = false, columnDefinition = "text")
    private String type; 

    @Column(columnDefinition = "text")
    private String status;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;
}