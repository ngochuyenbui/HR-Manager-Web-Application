package com.example.demo.repository;

import com.example.demo.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    // MỚI: Lấy danh sách nhân viên Fulltime đang Active để tính lương
    @Query(value = "SELECT * FROM employee_account WHERE type = 'Fulltime' AND status = 'Active'", nativeQuery = true)
    List<Employee> findAllActiveFulltime();

	@Modifying
	@Transactional
	@Query("UPDATE Employee e SET e.status = :status WHERE e.id = :id")
	void updateStatusById(@Param("id") Long id, @Param("status") String status);

	// Native update that casts the provided string to the Postgres enum type `emp_status_enum`.
	// This avoids JDBC/driver issues when setting enum columns via a prepared statement.
	@Modifying
	@Transactional
	@Query(value = "UPDATE employee_account SET status = CAST(:status AS emp_status_enum) WHERE id = :id", nativeQuery = true)
	void updateStatusByIdNative(@Param("id") Long id, @Param("status") String status);

	// Native update to change only the 'type' column and cast to DB enum `emp_type_enum`.
	@Modifying
	@Transactional
	@Query(value = "UPDATE employee_account SET type = CAST(:type AS emp_type_enum) WHERE id = :id", nativeQuery = true)
	void updateTypeByIdNative(@Param("id") Long id, @Param("type") String type);
    Employee findByUsername(String username);

	// Để Service biết nhân viên là Fulltime hay Freelance -> Gọi đúng Procedure
    @Query(value = "SELECT type FROM employee_account WHERE id = :id", nativeQuery = true)
    String findTypeById(@Param("id") Long id);

    // Lấy danh sách Freelancer đang Active (Để tính lương hàng loạt cho Freelance)
    @Query(value = "SELECT * FROM employee_account WHERE type = 'Freelance' AND status = 'Active'", nativeQuery = true)
    List<Employee> findAllActiveFreelance();
}