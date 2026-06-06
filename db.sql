--
-- PostgreSQL database dump
--


-- Dumped from database version 15.15 (Debian 15.15-1.pgdg13+1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS "HRM";
--
-- Name: HRM; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE "HRM" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE "HRM" OWNER TO postgres;

\unrestrict dkfeMv11Od9ZIIeH2VFrOJxNcJK7hejygFsg0UIwYZe4gD70D4mgtmmyQvrCSCn
\connect "HRM"
\restrict dkfeMv11Od9ZIIeH2VFrOJxNcJK7hejygFsg0UIwYZe4gD70D4mgtmmyQvrCSCn

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: contract_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.contract_type_enum AS ENUM (
    'Definite',
    'Indefinite'
);


ALTER TYPE public.contract_type_enum OWNER TO postgres;

--
-- Name: day_of_week_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.day_of_week_enum AS ENUM (
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
);


ALTER TYPE public.day_of_week_enum OWNER TO postgres;

--
-- Name: emp_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.emp_status_enum AS ENUM (
    'Active',
    'Inactive',
    'Resigned'
);


ALTER TYPE public.emp_status_enum OWNER TO postgres;

--
-- Name: emp_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.emp_type_enum AS ENUM (
    'Fulltime',
    'Freelance'
);


ALTER TYPE public.emp_type_enum OWNER TO postgres;

--
-- Name: gender_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.gender_enum AS ENUM (
    'Male',
    'Female',
    'Other'
);


ALTER TYPE public.gender_enum OWNER TO postgres;

--
-- Name: payroll_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payroll_status_enum AS ENUM (
    'Paid',
    'Unpaid'
);


ALTER TYPE public.payroll_status_enum OWNER TO postgres;

--
-- Name: sp_generate_freelance_payslip(bigint, bigint, jsonb); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.sp_generate_freelance_payslip(IN p_payroll_id bigint, IN p_employee_id bigint, IN p_adjustments jsonb DEFAULT '{"bonuses": [], "penalties": []}'::jsonb)
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Payroll info
    v_payroll_status payroll_status_enum;
    v_payroll_month INT;
    v_payroll_year INT;

    -- Contract info
    v_contract_id INT;
    v_contract_full_value DECIMAL(15, 2);
    v_contract_end_date DATE;
    
    -- Calculation vars
    v_contract_payment DECIMAL(15, 2) := 0; -- Số tiền hợp đồng thực trả kỳ này
    v_payslip_id INT;
    
    v_total_bonus DECIMAL(15, 2) := 0;
    v_total_penalty DECIMAL(15, 2) := 0;
    v_final_amount DECIMAL(15, 2);
    
    -- Temp vars
    r_bonus RECORD;
    r_penalty RECORD;
    v_item_amount DECIMAL(15, 2);
    v_stt INT := 1;
BEGIN
    -- 1. Check Status Payroll & Get Period Info
    SELECT status, month, year 
    INTO v_payroll_status, v_payroll_month, v_payroll_year
    FROM payroll 
    WHERE id = p_payroll_id;

    IF v_payroll_status = 'Paid' THEN
        RAISE EXCEPTION 'PAYROLL_LOCKED: Kỳ lương đã thanh toán.';
    END IF;

    IF v_payroll_status IS NULL THEN
        RAISE EXCEPTION 'PAYROLL_NOT_FOUND: Không tìm thấy kỳ lương ID %', p_payroll_id;
    END IF;

    -- 2. Get Active Contract Info
    -- Lấy hợp đồng active dựa trên end_date chưa qua hoặc mới nhất
    SELECT contract_id, value, end_date
    INTO v_contract_id, v_contract_full_value, v_contract_end_date
    FROM freelance_contract
    WHERE employee_id = p_employee_id
    ORDER BY start_date DESC LIMIT 1;

    IF v_contract_id IS NULL THEN
        RAISE NOTICE 'No active freelance contract for Emp ID %', p_employee_id;
        RETURN;
    END IF;

    -- =================================================================================
    -- [LOGIC MỚI] 3. Kiểm tra xem kỳ lương này có phải tháng kết thúc hợp đồng không?
    -- =================================================================================
    IF (EXTRACT(MONTH FROM v_contract_end_date) = v_payroll_month AND 
        EXTRACT(YEAR FROM v_contract_end_date) = v_payroll_year) THEN
        
        v_contract_payment := v_contract_full_value;
        RAISE NOTICE 'CONTRACT MATURITY: Kỳ lương trùng tháng kết thúc hợp đồng. Thanh toán full: %', v_contract_payment;
    ELSE
        v_contract_payment := 0;
        RAISE NOTICE 'INTERIM PERIOD: Chưa đến tháng kết thúc hợp đồng (%-%). Chỉ tính Bonus/Penalty nếu có.', EXTRACT(MONTH FROM v_contract_end_date), EXTRACT(YEAR FROM v_contract_end_date);
    END IF;

    -- 4. Calculate Bonuses (Vẫn tính nếu có yêu cầu, bất kể tháng nào)
    FOR r_bonus IN SELECT name, amount, rate FROM freelance_contract_bonus WHERE contract_id = v_contract_id LOOP
        IF (p_adjustments->'bonuses') ? r_bonus.name THEN
            v_item_amount := COALESCE(r_bonus.amount, v_contract_full_value * (r_bonus.rate / 100.0));
            v_total_bonus := v_total_bonus + v_item_amount;
        END IF;
    END LOOP;

    -- 5. Calculate Penalties
    FOR r_penalty IN SELECT name, amount, rate FROM freelance_contract_penalty WHERE contract_id = v_contract_id LOOP
        IF (p_adjustments->'penalties') ? r_penalty.name THEN
            v_item_amount := COALESCE(r_penalty.amount, v_contract_full_value * (r_penalty.rate / 100.0));
            v_total_penalty := v_total_penalty + v_item_amount;
        END IF;
    END LOOP;

    -- 6. Final Calculation
    -- Final = (0 hoặc Full Value) + Bonus - Penalty
    v_final_amount := v_contract_payment + v_total_bonus - v_total_penalty;

    -- 7. Cleanup Old Data (Re-calculate support)
    DELETE FROM freelance_actual_bonus WHERE payslip_id IN (SELECT payslip_id FROM freelance_payslip WHERE payroll_id = p_payroll_id AND employee_id = p_employee_id);
    DELETE FROM freelance_actual_penalty WHERE payslip_id IN (SELECT payslip_id FROM freelance_payslip WHERE payroll_id = p_payroll_id AND employee_id = p_employee_id);
    DELETE FROM freelance_payslip WHERE payroll_id = p_payroll_id AND employee_id = p_employee_id;

    -- 8. Insert Header
    INSERT INTO freelance_payslip (payroll_id, employee_id, contract_id, final_amount)
    VALUES (p_payroll_id, p_employee_id, v_contract_id, v_final_amount)
    RETURNING payslip_id INTO v_payslip_id;

    -- 9. Insert Details (Bonus)
    v_stt := 1;
    FOR r_bonus IN SELECT name, amount, rate FROM freelance_contract_bonus WHERE contract_id = v_contract_id LOOP
        IF (p_adjustments->'bonuses') ? r_bonus.name THEN
            v_item_amount := COALESCE(r_bonus.amount, v_contract_full_value * (r_bonus.rate / 100.0));
            INSERT INTO freelance_actual_bonus (payslip_id, stt, name, amount) 
            VALUES (v_payslip_id, v_stt, r_bonus.name, v_item_amount);
            v_stt := v_stt + 1;
        END IF;
    END LOOP;

    -- 10. Insert Details (Penalty)
    v_stt := 1;
    FOR r_penalty IN SELECT name, amount, rate FROM freelance_contract_penalty WHERE contract_id = v_contract_id LOOP
        IF (p_adjustments->'penalties') ? r_penalty.name THEN
            v_item_amount := COALESCE(r_penalty.amount, v_contract_full_value * (r_penalty.rate / 100.0));
            INSERT INTO freelance_actual_penalty (payslip_id, stt, name, amount) 
            VALUES (v_payslip_id, v_stt, r_penalty.name, v_item_amount);
            v_stt := v_stt + 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'SUCCESS: Generated Freelance Payslip ID %. Contract Pay: %, Total: %', v_payslip_id, to_char(v_contract_payment, 'FM999,999,999,999'), to_char(v_final_amount, 'FM999,999,999,999');
END;
$$;


ALTER PROCEDURE public.sp_generate_freelance_payslip(IN p_payroll_id bigint, IN p_employee_id bigint, IN p_adjustments jsonb) OWNER TO postgres;

--
-- Name: sp_generate_fulltime_payslip(bigint, bigint, numeric, numeric, jsonb, jsonb); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.sp_generate_fulltime_payslip(IN p_payroll_id bigint, IN p_employee_id bigint, IN p_actual_work_days numeric, IN p_ot_hours numeric, IN p_manual_bonus jsonb DEFAULT '{}'::jsonb, IN p_manual_penalty jsonb DEFAULT '{}'::jsonb)
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Constants
    HOURS_STANDARD_DAY CONSTANT INT := 8;
    SELF_DEDUCTION CONSTANT DECIMAL(15, 2) := 15500000.00; 
    DEPENDENT_UNIT_AMOUNT CONSTANT DECIMAL(15, 2) := 6200000.00; 

    v_payroll_status payroll_status_enum;
    v_month INT; v_year INT;
    
    v_contract_id INT;
    v_base_salary DECIMAL(15, 2);
    v_payslip_id INT;
    v_hours_standard_month DECIMAL(15, 2);
    v_standard_work_days DECIMAL(5, 2);
    
    -- Allowances & Bonuses
    v_responsibility_allowance DECIMAL(15, 2) := 0; 
    v_living_allowance DECIMAL(15, 2) := 0; 
    v_travel_allowance DECIMAL(15, 2) := 0;
    v_holiday_bonus DECIMAL(15, 2) := 0;
    v_other_bonus DECIMAL(15, 2) := 0;
    v_performance_bonus DECIMAL(15, 2) := 0;
    v_quarter_bonus DECIMAL(15, 2) := 0;
    v_year_bonus DECIMAL(15, 2) := 0;
    v_total_bonus DECIMAL(15, 2) := 0;
    
    -- Penalty & STT
    v_total_penalty DECIMAL(15, 2) := 0;
    r_penalty RECORD;
    v_stt_counter INT := 1;
    
    -- Calculation vars
    v_ot_rate DECIMAL(15, 2) := 0;
    v_ot_amount DECIMAL(15, 2) := 0;
    v_contract_gross DECIMAL(15, 2);
    v_actual_gross_income DECIMAL(15, 2);
    
    -- Deductions
    v_bhxh DECIMAL(15, 2); v_bhyt DECIMAL(15, 2); v_bhtn DECIMAL(15, 2);
    v_dependent_count INT := 0;
    v_total_dep_deduction DECIMAL(15, 2) := 0;
    v_total_statutory_deduction DECIMAL(15, 2);
    
    v_taxable_income DECIMAL(15, 2) := 0; 
    v_saved_taxable_income DECIMAL(15, 2) := 0; 
    v_tax DECIMAL(15, 2) := 0; 
    v_net_income DECIMAL(15, 2); 

    r_bonus RECORD;
    v_calc_amount DECIMAL(15, 2) := 0;

BEGIN
    -- 1. CHECK STATUS
    SELECT status, month, year INTO v_payroll_status, v_month, v_year 
    FROM payroll WHERE id = p_payroll_id;

    IF v_payroll_status = 'Paid' THEN
        RAISE EXCEPTION 'PAYROLL_LOCKED: Kỳ lương này đã khóa.';
    END IF;

    IF p_actual_work_days < 0 THEN RAISE EXCEPTION 'Actual work days cannot be negative.'; END IF;

    -- 2. GET CONTRACT
    SELECT contract_id, base_salary, ot_rate, standard_work_days
    INTO v_contract_id, v_base_salary, v_ot_rate, v_standard_work_days
    FROM fulltime_contract
    WHERE employee_id = p_employee_id
    ORDER BY start_date DESC LIMIT 1;

    IF v_contract_id IS NULL THEN RETURN; END IF;

    IF v_standard_work_days IS NULL OR v_standard_work_days = 0 THEN 
        v_standard_work_days := 22.0; 
    END IF;

    v_hours_standard_month := v_standard_work_days * HOURS_STANDARD_DAY;

    -- 3. ALLOWANCES
    SELECT COALESCE(SUM(CASE WHEN name = 'Responsibility Allowance' THEN amount ELSE 0 END), 0),
           COALESCE(SUM(CASE WHEN name = 'Living Allowance' THEN amount ELSE 0 END), 0),
           COALESCE(SUM(CASE WHEN name = 'Travel Allowance' THEN amount ELSE 0 END), 0)
    INTO v_responsibility_allowance, v_living_allowance, v_travel_allowance
    FROM fulltime_contract_allowance WHERE contract_id = v_contract_id;

    -- 4. BONUS PROCESS
    v_holiday_bonus := COALESCE((p_manual_bonus->>'holiday')::DECIMAL, 0);
    v_other_bonus   := COALESCE((p_manual_bonus->>'other')::DECIMAL, 0);

    FOR r_bonus IN SELECT name, amount, rate FROM fulltime_contract_bonus WHERE contract_id = v_contract_id LOOP
        v_calc_amount := COALESCE(r_bonus.amount, v_base_salary * (r_bonus.rate / 100.0));
        IF r_bonus.name ILIKE '%Performance%' THEN v_performance_bonus := v_performance_bonus + v_calc_amount;
        ELSIF r_bonus.name ILIKE '%Quarter%' AND v_month IN (3, 6, 9, 12) THEN v_quarter_bonus := v_quarter_bonus + v_calc_amount;
        ELSIF r_bonus.name ILIKE '%Year%' AND v_month = 12 THEN v_year_bonus := v_year_bonus + v_calc_amount;
        END IF;
    END LOOP;

    v_total_bonus := v_holiday_bonus + v_other_bonus + v_performance_bonus + v_quarter_bonus + v_year_bonus;

    -- 5. OT & GROSS
    IF p_ot_hours > 0 AND v_ot_rate IS NOT NULL THEN
        v_ot_amount := (v_base_salary / v_hours_standard_month) * p_ot_hours * v_ot_rate;
    END IF;

    v_contract_gross := v_base_salary + v_responsibility_allowance + v_living_allowance;
    
    -- Tính Gross thực tế (Đã bao gồm ngày công thực tế, OT, Bonus...)
    v_actual_gross_income := (v_contract_gross + v_total_bonus + v_ot_amount + v_travel_allowance) / v_standard_work_days * p_actual_work_days;
                             
    -- 6. DEDUCTIONS (BẢO HIỂM)
    -- [UPDATED LOGIC] Dùng v_actual_gross_income để tính % bảo hiểm thay vì v_base_salary
    SELECT 
        COALESCE(SUM(CASE WHEN name = 'Social Insurance' THEN (v_actual_gross_income * rate / 100.0) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN name = 'Health Insurance' THEN (v_actual_gross_income * rate / 100.0) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN name = 'Unemployment Insurance' THEN (v_actual_gross_income * rate / 100.0) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN name = 'Dependent Deduction' THEN amount ELSE 0 END), 0)
    INTO v_bhxh, v_bhyt, v_bhtn, v_dependent_count
    FROM fulltime_contract_deduction WHERE contract_id = v_contract_id;

    v_total_statutory_deduction := v_bhxh + v_bhyt + v_bhtn;
    v_total_dep_deduction := v_dependent_count * DEPENDENT_UNIT_AMOUNT;

    -- 7. PIT (5 BẬC)
    v_taxable_income := GREATEST(0, v_actual_gross_income - v_total_statutory_deduction - SELF_DEDUCTION - v_total_dep_deduction);
    v_saved_taxable_income := v_taxable_income;

    IF v_taxable_income > 0 THEN
        IF v_taxable_income > 100000000 THEN v_tax := v_tax + (v_taxable_income - 100000000) * 0.35; v_taxable_income := 100000000; END IF;
        IF v_taxable_income > 60000000 THEN v_tax := v_tax + (v_taxable_income - 60000000) * 0.30; v_taxable_income := 60000000; END IF;
        IF v_taxable_income > 30000000 THEN v_tax := v_tax + (v_taxable_income - 30000000) * 0.20; v_taxable_income := 30000000; END IF;
        IF v_taxable_income > 10000000 THEN v_tax := v_tax + (v_taxable_income - 10000000) * 0.10; v_taxable_income := 10000000; END IF;
        v_tax := v_tax + v_taxable_income * 0.05;
    END IF;

    -- 8. PENALTY
    SELECT SUM(value::DECIMAL) INTO v_total_penalty FROM jsonb_each_text(p_manual_penalty);
    v_total_penalty := COALESCE(v_total_penalty, 0);

    -- 9. NET INCOME
    v_net_income := GREATEST(0, v_actual_gross_income - v_total_statutory_deduction - v_tax - v_total_penalty);

    -- 10. PERSIST
    -- Clean up child tables first
    DELETE FROM fulltime_actual_allowance WHERE payslip_id IN (SELECT payslip_id FROM fulltime_payslip WHERE payroll_id = p_payroll_id AND employee_id = p_employee_id);
    DELETE FROM fulltime_actual_bonus WHERE payslip_id IN (SELECT payslip_id FROM fulltime_payslip WHERE payroll_id = p_payroll_id AND employee_id = p_employee_id);
    DELETE FROM fulltime_payslip_deduction WHERE payslip_id IN (SELECT payslip_id FROM fulltime_payslip WHERE payroll_id = p_payroll_id AND employee_id = p_employee_id);
    
    DELETE FROM fulltime_payslip WHERE payroll_id = p_payroll_id AND employee_id = p_employee_id;

    INSERT INTO fulltime_payslip (
        payroll_id, employee_id, contract_id, gross_salary, net_salary,
        snap_actual_work_days, snap_ot_hours, snap_taxable_income
    )
    VALUES (
        p_payroll_id, p_employee_id, v_contract_id, v_actual_gross_income, v_net_income,
        p_actual_work_days, p_ot_hours, v_saved_taxable_income
    )
    RETURNING payslip_id INTO v_payslip_id;

    -- Insert Allowances
    INSERT INTO fulltime_actual_allowance (payslip_id, stt, name, amount)
    SELECT v_payslip_id, stt, name, amount
    FROM fulltime_contract_allowance
    WHERE contract_id = v_contract_id;

    -- Insert Bonuses (only those that apply based on calculation logic)
    v_stt_counter := 1;
    FOR r_bonus IN SELECT name, amount, rate FROM fulltime_contract_bonus WHERE contract_id = v_contract_id LOOP
        v_calc_amount := COALESCE(r_bonus.amount, v_base_salary * (r_bonus.rate / 100.0));
        IF r_bonus.name ILIKE '%Performance%' THEN
            INSERT INTO fulltime_actual_bonus (payslip_id, stt, name, amount) VALUES (v_payslip_id, v_stt_counter, r_bonus.name, v_calc_amount);
            v_stt_counter := v_stt_counter + 1;
        ELSIF r_bonus.name ILIKE '%Quarter%' AND v_month IN (3, 6, 9, 12) THEN
            INSERT INTO fulltime_actual_bonus (payslip_id, stt, name, amount) VALUES (v_payslip_id, v_stt_counter, r_bonus.name, v_calc_amount);
            v_stt_counter := v_stt_counter + 1;
        ELSIF r_bonus.name ILIKE '%Year%' AND v_month = 12 THEN
            INSERT INTO fulltime_actual_bonus (payslip_id, stt, name, amount) VALUES (v_payslip_id, v_stt_counter, r_bonus.name, v_calc_amount);
            v_stt_counter := v_stt_counter + 1;
        END IF;
    END LOOP;

    -- Insert manual bonuses (holiday, other)
    IF v_holiday_bonus > 0 THEN
        INSERT INTO fulltime_actual_bonus (payslip_id, stt, name, amount) VALUES (v_payslip_id, v_stt_counter, 'Holiday Bonus', v_holiday_bonus);
        v_stt_counter := v_stt_counter + 1;
    END IF;
    IF v_other_bonus > 0 THEN
        INSERT INTO fulltime_actual_bonus (payslip_id, stt, name, amount) VALUES (v_payslip_id, v_stt_counter, 'Other Bonus', v_other_bonus);
        v_stt_counter := v_stt_counter + 1;
    END IF;

    INSERT INTO fulltime_payslip_deduction (payslip_id, stt, name, amount) VALUES
    (v_payslip_id, 1, 'Self Deduction', SELF_DEDUCTION),
    (v_payslip_id, 2, 'Dependent Deduction (' || v_dependent_count || ')', v_total_dep_deduction),
    (v_payslip_id, 3, 'Social Insurance', v_bhxh),
    (v_payslip_id, 4, 'Health Insurance', v_bhyt),
    (v_payslip_id, 5, 'Unemployment Insurance', v_bhtn),
    (v_payslip_id, 6, 'Personal Income Tax', v_tax);
    
    v_stt_counter := 7;
    FOR r_penalty IN SELECT key, value FROM jsonb_each_text(p_manual_penalty) LOOP
        INSERT INTO fulltime_payslip_deduction (payslip_id, stt, name, amount)
        VALUES (v_payslip_id, v_stt_counter, 'Penalty: ' || r_penalty.key, r_penalty.value::DECIMAL);
        v_stt_counter := v_stt_counter + 1;
    END LOOP;

    RAISE NOTICE 'SUCCESS: Payslip % generated.', v_payslip_id;
END;
$$;


ALTER PROCEDURE public.sp_generate_fulltime_payslip(IN p_payroll_id bigint, IN p_employee_id bigint, IN p_actual_work_days numeric, IN p_ot_hours numeric, IN p_manual_bonus jsonb, IN p_manual_penalty jsonb) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: employee_account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_account (
    id integer NOT NULL,
    f_name character varying(50) NOT NULL,
    m_name character varying(50),
    l_name character varying(50) NOT NULL,
    sex text,
    phone character varying(20),
    email character varying(100) NOT NULL,
    bank_account_number character varying(50),
    address text,
    dob date,
    type text NOT NULL,
    status text DEFAULT 'Active'::text,
    username character varying(50) NOT NULL,
    password character varying(255) NOT NULL
);


ALTER TABLE public.employee_account OWNER TO postgres;

--
-- Name: employee_account_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_account_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.employee_account_id_seq OWNER TO postgres;

--
-- Name: employee_account_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_account_id_seq OWNED BY public.employee_account.id;


--
-- Name: freelance_actual_bonus; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.freelance_actual_bonus (
    payslip_id integer NOT NULL,
    stt integer NOT NULL,
    name character varying(100),
    amount numeric(15,2)
);


ALTER TABLE public.freelance_actual_bonus OWNER TO postgres;

--
-- Name: freelance_actual_penalty; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.freelance_actual_penalty (
    payslip_id integer NOT NULL,
    stt integer NOT NULL,
    name character varying(100),
    amount numeric(15,2)
);


ALTER TABLE public.freelance_actual_penalty OWNER TO postgres;

--
-- Name: freelance_contract; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.freelance_contract (
    contract_id integer NOT NULL,
    employee_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    value numeric(15,2) NOT NULL,
    committed_deadline date,
    document_path character varying(500),
    CONSTRAINT chk_contract_value_positive CHECK ((value > (0)::numeric)),
    CONSTRAINT chk_freelance_dates CHECK ((start_date < end_date))
);


ALTER TABLE public.freelance_contract OWNER TO postgres;

--
-- Name: freelance_contract_bonus; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.freelance_contract_bonus (
    contract_id integer NOT NULL,
    stt integer NOT NULL,
    name character varying(100),
    amount numeric(15,2),
    rate numeric(5,2)
);


ALTER TABLE public.freelance_contract_bonus OWNER TO postgres;

--
-- Name: freelance_contract_contract_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.freelance_contract_contract_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.freelance_contract_contract_id_seq OWNER TO postgres;

--
-- Name: freelance_contract_contract_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.freelance_contract_contract_id_seq OWNED BY public.freelance_contract.contract_id;


--
-- Name: freelance_contract_penalty; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.freelance_contract_penalty (
    contract_id integer NOT NULL,
    stt integer NOT NULL,
    name character varying(100),
    amount numeric(15,2),
    rate numeric(5,2)
);


ALTER TABLE public.freelance_contract_penalty OWNER TO postgres;

--
-- Name: freelance_payslip; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.freelance_payslip (
    payslip_id integer NOT NULL,
    payroll_id integer NOT NULL,
    employee_id integer NOT NULL,
    contract_id integer NOT NULL,
    final_amount numeric(15,2)
);


ALTER TABLE public.freelance_payslip OWNER TO postgres;

--
-- Name: freelance_payslip_payslip_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.freelance_payslip_payslip_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.freelance_payslip_payslip_id_seq OWNER TO postgres;

--
-- Name: freelance_payslip_payslip_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.freelance_payslip_payslip_id_seq OWNED BY public.freelance_payslip.payslip_id;


--
-- Name: fulltime_actual_allowance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulltime_actual_allowance (
    payslip_id integer NOT NULL,
    stt integer NOT NULL,
    name character varying(100),
    amount numeric(15,2)
);


ALTER TABLE public.fulltime_actual_allowance OWNER TO postgres;

--
-- Name: fulltime_actual_bonus; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulltime_actual_bonus (
    payslip_id integer NOT NULL,
    stt integer NOT NULL,
    name character varying(100),
    amount numeric(15,2)
);


ALTER TABLE public.fulltime_actual_bonus OWNER TO postgres;

--
-- Name: fulltime_contract; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulltime_contract (
    contract_id integer NOT NULL,
    employee_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date,
    base_salary numeric(15,2) NOT NULL,
    ot_rate numeric(5,2) DEFAULT 1.5,
    standard_work_days numeric(5,2) DEFAULT 22.0,
    annual_leave_days integer DEFAULT 12,
    type text NOT NULL,
    document_path character varying(500),
    CONSTRAINT chk_annual_leave CHECK ((annual_leave_days >= 0)),
    CONSTRAINT chk_base_salary_positive CHECK ((base_salary > (0)::numeric)),
    CONSTRAINT chk_fulltime_dates CHECK (((start_date < end_date) OR (end_date IS NULL))),
    CONSTRAINT chk_ot_rate_positive CHECK ((ot_rate > (0)::numeric))
);


ALTER TABLE public.fulltime_contract OWNER TO postgres;

--
-- Name: fulltime_contract_allowance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulltime_contract_allowance (
    contract_id integer NOT NULL,
    stt integer NOT NULL,
    name character varying(100),
    amount numeric(15,2)
);


ALTER TABLE public.fulltime_contract_allowance OWNER TO postgres;

--
-- Name: fulltime_contract_bonus; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulltime_contract_bonus (
    contract_id integer NOT NULL,
    stt integer NOT NULL,
    name character varying(100),
    amount numeric(15,2),
    rate numeric(5,2)
);


ALTER TABLE public.fulltime_contract_bonus OWNER TO postgres;

--
-- Name: fulltime_contract_contract_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fulltime_contract_contract_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fulltime_contract_contract_id_seq OWNER TO postgres;

--
-- Name: fulltime_contract_contract_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fulltime_contract_contract_id_seq OWNED BY public.fulltime_contract.contract_id;


--
-- Name: fulltime_contract_deduction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulltime_contract_deduction (
    contract_id integer NOT NULL,
    stt integer NOT NULL,
    name character varying(100),
    amount numeric(15,2),
    rate numeric(5,2)
);


ALTER TABLE public.fulltime_contract_deduction OWNER TO postgres;

--
-- Name: fulltime_contract_workday; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulltime_contract_workday (
    contract_id integer NOT NULL,
    day public.day_of_week_enum NOT NULL,
    start_at time without time zone,
    end_at time without time zone
);


ALTER TABLE public.fulltime_contract_workday OWNER TO postgres;

--
-- Name: fulltime_payslip; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulltime_payslip (
    payslip_id integer NOT NULL,
    payroll_id integer NOT NULL,
    employee_id integer NOT NULL,
    contract_id integer NOT NULL,
    net_salary numeric(15,2),
    gross_salary numeric(15,2),
    snap_actual_work_days numeric(15,2),
    snap_ot_hours numeric(15,2),
    snap_taxable_income numeric(15,2)
);


ALTER TABLE public.fulltime_payslip OWNER TO postgres;

--
-- Name: fulltime_payslip_deduction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fulltime_payslip_deduction (
    payslip_id integer NOT NULL,
    stt integer NOT NULL,
    name character varying(100),
    amount numeric(15,2)
);


ALTER TABLE public.fulltime_payslip_deduction OWNER TO postgres;

--
-- Name: fulltime_payslip_payslip_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.fulltime_payslip_payslip_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.fulltime_payslip_payslip_id_seq OWNER TO postgres;

--
-- Name: fulltime_payslip_payslip_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.fulltime_payslip_payslip_id_seq OWNED BY public.fulltime_payslip.payslip_id;


--
-- Name: hr; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hr (
    id integer NOT NULL,
    permission_level character varying(50) DEFAULT 'Staff'::character varying
);


ALTER TABLE public.hr OWNER TO postgres;

--
-- Name: leave_request; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_request (
    id integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    leave_type character varying(50),
    reason text,
    is_approved boolean,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    employee_create integer NOT NULL,
    hr_approve integer,
    CONSTRAINT chk_leave_dates CHECK ((start_date <= end_date))
);


ALTER TABLE public.leave_request OWNER TO postgres;

--
-- Name: leave_request_cancel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_request_cancel (
    leave_request_id integer NOT NULL,
    employee_id integer NOT NULL,
    cancelled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    hr_approve integer,
    reason text
);


ALTER TABLE public.leave_request_cancel OWNER TO postgres;

--
-- Name: leave_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.leave_request_id_seq OWNER TO postgres;

--
-- Name: leave_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_request_id_seq OWNED BY public.leave_request.id;


--
-- Name: payroll; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll (
    id integer NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status public.payroll_status_enum DEFAULT 'Unpaid'::public.payroll_status_enum,
    hr_approve integer,
    is_approved boolean DEFAULT false
);


ALTER TABLE public.payroll OWNER TO postgres;

--
-- Name: payroll_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payroll_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payroll_id_seq OWNER TO postgres;

--
-- Name: payroll_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payroll_id_seq OWNED BY public.payroll.id;


--
-- Name: timesheet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.timesheet (
    id integer NOT NULL,
    date date NOT NULL,
    checkin_time timestamp without time zone,
    checkout_time timestamp without time zone,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    employee_id integer NOT NULL
);


ALTER TABLE public.timesheet OWNER TO postgres;

--
-- Name: timesheet_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.timesheet_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.timesheet_id_seq OWNER TO postgres;

--
-- Name: timesheet_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.timesheet_id_seq OWNED BY public.timesheet.id;


--
-- Name: view_freelance_payslip_detail; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.view_freelance_payslip_detail AS
 SELECT fp.payslip_id,
    fp.payroll_id,
    fp.employee_id,
    (((e.f_name)::text || ' '::text) || (e.l_name)::text) AS full_name,
    e.bank_account_number,
    fc.value AS contract_total_value,
    fp.final_amount,
    (COALESCE(( SELECT json_agg(json_build_object('name', fb.name, 'amount', fb.amount)) AS json_agg
           FROM public.freelance_actual_bonus fb
          WHERE (fb.payslip_id = fp.payslip_id)), '[]'::json))::text AS bonuses_json,
    (COALESCE(( SELECT json_agg(json_build_object('name', fp_pen.name, 'amount', fp_pen.amount)) AS json_agg
           FROM public.freelance_actual_penalty fp_pen
          WHERE (fp_pen.payslip_id = fp.payslip_id)), '[]'::json))::text AS penalties_json
   FROM ((public.freelance_payslip fp
     JOIN public.employee_account e ON ((fp.employee_id = e.id)))
     JOIN public.freelance_contract fc ON ((fp.contract_id = fc.contract_id)));


ALTER TABLE public.view_freelance_payslip_detail OWNER TO postgres;

--
-- Name: view_fulltime_payslip_detail; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.view_fulltime_payslip_detail AS
 SELECT fp.payslip_id,
    fp.payroll_id,
    fp.employee_id,
    (((e.f_name)::text || ' '::text) || (e.l_name)::text) AS full_name,
    e.bank_account_number,
    fp.gross_salary,
    fp.net_salary,
    fp.snap_taxable_income AS taxable_income,
    fp.snap_actual_work_days AS actual_work_days,
    fc.standard_work_days AS formula_standard_days,
    fp.snap_ot_hours AS ot_hours,
    fc.ot_rate AS formula_ot_rate,
    fc.base_salary,
    (COALESCE(( SELECT json_agg(json_build_object('name', fa.name, 'actual_amount', fa.amount)) AS json_agg
           FROM public.fulltime_actual_allowance fa
          WHERE (fa.payslip_id = fp.payslip_id)), '[]'::json))::text AS allowances_json,
    (COALESCE(( SELECT json_agg(json_build_object('name', fb.name, 'actual_amount', fb.amount, 'contract_rate', cb.rate)) AS json_agg
           FROM (public.fulltime_actual_bonus fb
             LEFT JOIN public.fulltime_contract_bonus cb ON (((cb.contract_id = fp.contract_id) AND ((cb.name)::text = (fb.name)::text))))
          WHERE (fb.payslip_id = fp.payslip_id)), '[]'::json))::text AS bonuses_json,
    (COALESCE(( SELECT json_agg(json_build_object('name', fd.name, 'actual_amount', fd.amount, 'contract_rate', cd.rate)) AS json_agg
           FROM (public.fulltime_payslip_deduction fd
             LEFT JOIN public.fulltime_contract_deduction cd ON (((cd.contract_id = fp.contract_id) AND ((cd.name)::text = (fd.name)::text))))
          WHERE (fd.payslip_id = fp.payslip_id)), '[]'::json))::text AS deductions_json
   FROM ((public.fulltime_payslip fp
     JOIN public.employee_account e ON ((fp.employee_id = e.id)))
     JOIN public.fulltime_contract fc ON ((fp.contract_id = fc.contract_id)));


ALTER TABLE public.view_fulltime_payslip_detail OWNER TO postgres;

--
-- Name: employee_account id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_account ALTER COLUMN id SET DEFAULT nextval('public.employee_account_id_seq'::regclass);


--
-- Name: freelance_contract contract_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelance_contract ALTER COLUMN contract_id SET DEFAULT nextval('public.freelance_contract_contract_id_seq'::regclass);


--
-- Name: freelance_payslip payslip_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelance_payslip ALTER COLUMN payslip_id SET DEFAULT nextval('public.freelance_payslip_payslip_id_seq'::regclass);


--
-- Name: fulltime_contract contract_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_contract ALTER COLUMN contract_id SET DEFAULT nextval('public.fulltime_contract_contract_id_seq'::regclass);


--
-- Name: fulltime_payslip payslip_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_payslip ALTER COLUMN payslip_id SET DEFAULT nextval('public.fulltime_payslip_payslip_id_seq'::regclass);


--
-- Name: leave_request id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_request ALTER COLUMN id SET DEFAULT nextval('public.leave_request_id_seq'::regclass);


--
-- Name: payroll id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll ALTER COLUMN id SET DEFAULT nextval('public.payroll_id_seq'::regclass);


--
-- Name: timesheet id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timesheet ALTER COLUMN id SET DEFAULT nextval('public.timesheet_id_seq'::regclass);


--
-- Data for Name: employee_account; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.employee_account VALUES (1, 'John', 'Michael', 'Smith', 'Male', '+84901234567', 'john.smith@company.com', '1234567890', '123 Nguyen Hue St, District 1, HCMC', '1990-05-15', 'Fulltime', 'Active', 'jsmith', 'hashed_password_123');
INSERT INTO public.employee_account VALUES (2, 'Sarah', 'Jane', 'Johnson', 'Female', '+84901234568', 'sarah.johnson@company.com', '1234567891', '456 Le Loi St, District 1, HCMC', '1992-08-22', 'Fulltime', 'Active', 'sjohnson', 'hashed_password_456');
INSERT INTO public.employee_account VALUES (3, 'Michael', NULL, 'Brown', 'Male', '+84901234569', 'michael.brown@company.com', '1234567892', '789 Hai Ba Trung St, District 3, HCMC', '1988-03-10', 'Fulltime', 'Active', 'mbrown', 'hashed_password_789');
INSERT INTO public.employee_account VALUES (4, 'Emily', 'Rose', 'Davis', 'Female', '+84901234570', 'emily.davis@company.com', '1234567893', '321 Tran Hung Dao St, District 5, HCMC', '1995-11-30', 'Freelance', 'Active', 'edavis', 'hashed_password_101');
INSERT INTO public.employee_account VALUES (5, 'David', 'Lee', 'Wilson', 'Male', '+84901234571', 'david.wilson@company.com', '1234567894', '654 Pham Ngu Lao St, District 1, HCMC', '1993-07-18', 'Freelance', 'Active', 'dwilson', 'hashed_password_202');


--
-- Data for Name: freelance_actual_bonus; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.freelance_actual_bonus VALUES (1, 1, 'Early Completion Bonus', 5000000.00);
INSERT INTO public.freelance_actual_bonus VALUES (2, 1, 'Quality Bonus', 8000000.00);


--
-- Data for Name: freelance_actual_penalty; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.freelance_actual_penalty VALUES (1, 1, 'Late Delivery Penalty', 2000000.00);


--
-- Data for Name: freelance_contract; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.freelance_contract VALUES (1, 4, '2024-01-15', '2026-01-31', 50000000.00, '2024-06-15', 'contracts/freelance_4.pdf');
INSERT INTO public.freelance_contract VALUES (2, 5, '2024-03-01', '2026-01-31', 80000000.00, '2024-11-30', 'contracts/freelance_5.pdf');


--
-- Data for Name: freelance_contract_bonus; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.freelance_contract_bonus VALUES (1, 1, 'Early Completion Bonus', 5000000.00, NULL);
INSERT INTO public.freelance_contract_bonus VALUES (2, 1, 'Quality Bonus', NULL, 10.00);


--
-- Data for Name: freelance_contract_penalty; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.freelance_contract_penalty VALUES (1, 1, 'Late Delivery Penalty', NULL, 5.00);
INSERT INTO public.freelance_contract_penalty VALUES (2, 1, 'Quality Issue Penalty', 3000000.00, NULL);


--
-- Data for Name: freelance_payslip; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.freelance_payslip VALUES (1, 1, 4, 1, 28000000.00);
INSERT INTO public.freelance_payslip VALUES (2, 1, 5, 2, 45000000.00);


--
-- Data for Name: fulltime_actual_allowance; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.fulltime_actual_allowance VALUES (1, 1, 'Responsibility Allowance', 1500000.00);
INSERT INTO public.fulltime_actual_allowance VALUES (1, 2, 'Living Allowance', 1000000.00);
INSERT INTO public.fulltime_actual_allowance VALUES (2, 1, 'Responsibility Allowance', 1500000.00);
INSERT INTO public.fulltime_actual_allowance VALUES (3, 1, 'Travel Allowance', 3000000.00);
INSERT INTO public.fulltime_actual_allowance VALUES (3, 2, 'Responsibility Allowance', 2000000.00);


--
-- Data for Name: fulltime_actual_bonus; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.fulltime_actual_bonus VALUES (1, 1, 'Performance Bonus', 2500000.00);
INSERT INTO public.fulltime_actual_bonus VALUES (2, 1, 'Quarterly Bonus', 2000000.00);
INSERT INTO public.fulltime_actual_bonus VALUES (3, 1, 'Annual Bonus', 4500000.00);


--
-- Data for Name: fulltime_contract; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.fulltime_contract VALUES (1, 1, '2023-01-01', NULL, 25000000.00, 1.50, 22.00, 15, 'Indefinite', NULL);
INSERT INTO public.fulltime_contract VALUES (2, 2, '2023-03-01', NULL, 22000000.00, 1.50, 22.00, 12, 'Indefinite', NULL);
INSERT INTO public.fulltime_contract VALUES (3, 3, '2024-01-01', '2025-12-31', 30000000.00, 2.00, 22.00, 12, 'Definite', NULL);


--
-- Data for Name: fulltime_contract_allowance; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.fulltime_contract_allowance VALUES (1, 1, 'Responsibility Allowance', 1500000.00);
INSERT INTO public.fulltime_contract_allowance VALUES (1, 2, 'Living Allowance', 1000000.00);
INSERT INTO public.fulltime_contract_allowance VALUES (2, 1, 'Responsibility Allowance', 1500000.00);
INSERT INTO public.fulltime_contract_allowance VALUES (3, 1, 'Travel Allowance', 3000000.00);
INSERT INTO public.fulltime_contract_allowance VALUES (3, 2, 'Responsibility Allowance', 2000000.00);


--
-- Data for Name: fulltime_contract_bonus; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.fulltime_contract_bonus VALUES (1, 1, 'Performance Bonus', NULL, 10.00);
INSERT INTO public.fulltime_contract_bonus VALUES (1, 2, 'Quarter Bonus', 3000000.00, NULL);
INSERT INTO public.fulltime_contract_bonus VALUES (1, 3, 'Year Bonus', NULL, 30.00);
INSERT INTO public.fulltime_contract_bonus VALUES (2, 1, 'Quarter Bonus', 2000000.00, NULL);
INSERT INTO public.fulltime_contract_bonus VALUES (2, 2, 'Year Bonus', NULL, 25.00);
INSERT INTO public.fulltime_contract_bonus VALUES (3, 1, 'Quarter Bonus', 1500000.00, NULL);
INSERT INTO public.fulltime_contract_bonus VALUES (3, 2, 'Year Bonus', NULL, 15.00);


--
-- Data for Name: fulltime_contract_deduction; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.fulltime_contract_deduction VALUES (1, 1, 'Social Insurance', NULL, 8.00);
INSERT INTO public.fulltime_contract_deduction VALUES (1, 2, 'Health Insurance', NULL, 1.50);
INSERT INTO public.fulltime_contract_deduction VALUES (1, 3, 'Unemployment Insurance', NULL, 1.00);
INSERT INTO public.fulltime_contract_deduction VALUES (2, 1, 'Social Insurance', NULL, 8.00);
INSERT INTO public.fulltime_contract_deduction VALUES (2, 2, 'Health Insurance', NULL, 1.50);
INSERT INTO public.fulltime_contract_deduction VALUES (2, 3, 'Unemployment Insurance', NULL, 1.00);
INSERT INTO public.fulltime_contract_deduction VALUES (3, 1, 'Social Insurance', NULL, 8.00);
INSERT INTO public.fulltime_contract_deduction VALUES (3, 2, 'Health Insurance', NULL, 1.50);
INSERT INTO public.fulltime_contract_deduction VALUES (3, 3, 'Unemployment Insurance', NULL, 1.00);


--
-- Data for Name: fulltime_contract_workday; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.fulltime_contract_workday VALUES (1, 'Monday', '08:00:00', '17:00:00');
INSERT INTO public.fulltime_contract_workday VALUES (1, 'Tuesday', '08:00:00', '17:00:00');
INSERT INTO public.fulltime_contract_workday VALUES (1, 'Wednesday', '08:00:00', '17:00:00');
INSERT INTO public.fulltime_contract_workday VALUES (1, 'Thursday', '08:00:00', '17:00:00');
INSERT INTO public.fulltime_contract_workday VALUES (1, 'Friday', '08:00:00', '17:00:00');
INSERT INTO public.fulltime_contract_workday VALUES (2, 'Monday', '09:00:00', '18:00:00');
INSERT INTO public.fulltime_contract_workday VALUES (2, 'Tuesday', '09:00:00', '18:00:00');
INSERT INTO public.fulltime_contract_workday VALUES (2, 'Wednesday', '09:00:00', '18:00:00');
INSERT INTO public.fulltime_contract_workday VALUES (2, 'Thursday', '09:00:00', '18:00:00');
INSERT INTO public.fulltime_contract_workday VALUES (2, 'Friday', '09:00:00', '18:00:00');
INSERT INTO public.fulltime_contract_workday VALUES (3, 'Monday', '08:30:00', '17:30:00');
INSERT INTO public.fulltime_contract_workday VALUES (3, 'Tuesday', '08:30:00', '17:30:00');
INSERT INTO public.fulltime_contract_workday VALUES (3, 'Wednesday', '08:30:00', '17:30:00');
INSERT INTO public.fulltime_contract_workday VALUES (3, 'Thursday', '08:30:00', '17:30:00');
INSERT INTO public.fulltime_contract_workday VALUES (3, 'Friday', '08:30:00', '17:30:00');


--
-- Data for Name: fulltime_payslip; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.fulltime_payslip VALUES (1, 1, 1, 1, 24500000.00, 27500000.00, NULL, NULL, NULL);
INSERT INTO public.fulltime_payslip VALUES (2, 1, 2, 2, 22000000.00, 25500000.00, NULL, NULL, NULL);
INSERT INTO public.fulltime_payslip VALUES (3, 1, 3, 3, 31500000.00, 35000000.00, NULL, NULL, NULL);
INSERT INTO public.fulltime_payslip VALUES (4, 3, 1, 1, 24000000.00, 27000000.00, NULL, NULL, NULL);
INSERT INTO public.fulltime_payslip VALUES (5, 4, 1, 1, 23500000.00, 27000000.00, NULL, NULL, NULL);
INSERT INTO public.fulltime_payslip VALUES (6, 5, 1, 1, 24500000.00, 27000000.00, NULL, NULL, NULL);
INSERT INTO public.fulltime_payslip VALUES (7, 6, 1, 1, 24000000.00, 27000000.00, NULL, NULL, NULL);
INSERT INTO public.fulltime_payslip VALUES (8, 7, 1, 1, 22000000.00, 25000000.00, NULL, NULL, NULL);


--
-- Data for Name: fulltime_payslip_deduction; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.fulltime_payslip_deduction VALUES (1, 1, 'Social Insurance', 2200000.00);
INSERT INTO public.fulltime_payslip_deduction VALUES (1, 2, 'Health Insurance', 412500.00);
INSERT INTO public.fulltime_payslip_deduction VALUES (1, 3, 'Unemployment Insurance', 275000.00);
INSERT INTO public.fulltime_payslip_deduction VALUES (2, 1, 'Social Insurance', 2040000.00);
INSERT INTO public.fulltime_payslip_deduction VALUES (2, 2, 'Health Insurance', 382500.00);
INSERT INTO public.fulltime_payslip_deduction VALUES (3, 1, 'Social Insurance', 2800000.00);


--
-- Data for Name: hr; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.hr VALUES (1, 'Manager');
INSERT INTO public.hr VALUES (2, 'Staff');


--
-- Data for Name: leave_request; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.leave_request VALUES (1, '2024-11-25', '2024-11-27', 'Annual', 'Family vacation', true, '2026-01-15 05:04:50.305042', 1, 1);
INSERT INTO public.leave_request VALUES (2, '2024-12-02', '2024-12-02', 'Sick', 'Medical appointment', true, '2026-01-15 05:04:50.305042', 2, 1);
INSERT INTO public.leave_request VALUES (3, '2024-12-10', '2024-12-15', 'Annual', 'Year-end holiday', NULL, '2026-01-15 05:04:50.305042', 3, NULL);
INSERT INTO public.leave_request VALUES (4, '2024-11-22', '2024-11-22', 'Unpaid', 'Personal matters', false, '2026-01-15 05:04:50.305042', 2, 1);


--
-- Data for Name: leave_request_cancel; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.leave_request_cancel VALUES (1, 1, '2026-01-15 05:04:50.307743', NULL, NULL);


--
-- Data for Name: payroll; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.payroll VALUES (1, '2024-11-01', '2024-11-30', 11, 2024, '2026-01-15 05:04:50.309195', 'Unpaid', 1, true);
INSERT INTO public.payroll VALUES (2, '2026-01-01', '2026-01-31', 1, 2026, '2026-01-15 05:04:50.338509', 'Unpaid', 1, true);
INSERT INTO public.payroll VALUES (3, '2024-10-01', '2024-10-31', 10, 2024, '2026-01-15 05:04:50.341774', 'Paid', NULL, true);
INSERT INTO public.payroll VALUES (4, '2024-09-01', '2024-09-30', 9, 2024, '2026-01-15 05:04:50.341774', 'Paid', NULL, true);
INSERT INTO public.payroll VALUES (5, '2024-08-01', '2024-08-31', 8, 2024, '2026-01-15 05:04:50.341774', 'Paid', NULL, true);
INSERT INTO public.payroll VALUES (6, '2024-07-01', '2024-07-31', 7, 2024, '2026-01-15 05:04:50.341774', 'Paid', NULL, true);
INSERT INTO public.payroll VALUES (7, '2024-06-01', '2024-06-30', 6, 2024, '2026-01-15 05:04:50.341774', 'Paid', NULL, true);


--
-- Data for Name: timesheet; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.timesheet VALUES (1, '2025-11-03', '2025-11-03 07:55:00', '2025-11-03 12:05:00', '2026-01-15 05:04:50.294244', 1);
INSERT INTO public.timesheet VALUES (2, '2025-11-03', '2025-11-03 13:00:00', '2025-11-03 17:10:00', '2026-01-15 05:04:50.294244', 1);
INSERT INTO public.timesheet VALUES (3, '2025-11-04', '2025-11-04 08:30:00', '2025-11-04 16:30:00', '2026-01-15 05:04:50.294244', 1);
INSERT INTO public.timesheet VALUES (4, '2025-11-05', '2025-11-05 07:50:00', '2025-11-05 17:00:00', '2026-01-15 05:04:50.294244', 1);
INSERT INTO public.timesheet VALUES (5, '2025-11-06', '2025-11-06 08:00:00', '2025-11-06 13:00:00', '2026-01-15 05:04:50.294244', 1);
INSERT INTO public.timesheet VALUES (6, '2025-11-07', '2025-11-07 08:00:00', '2025-11-07 10:30:00', '2026-01-15 05:04:50.294244', 1);
INSERT INTO public.timesheet VALUES (7, '2025-11-03', '2025-11-03 08:10:00', '2025-11-03 18:05:00', '2026-01-15 05:04:50.294244', 2);
INSERT INTO public.timesheet VALUES (8, '2025-11-03', '2025-11-03 08:05:00', '2025-11-03 17:40:00', '2026-01-15 05:04:50.294244', 3);
INSERT INTO public.timesheet VALUES (9, '2025-11-04', '2025-11-04 08:12:00', '2025-11-04 18:00:00', '2026-01-15 05:04:50.294244', 2);
INSERT INTO public.timesheet VALUES (10, '2025-11-04', '2025-11-04 07:58:00', '2025-11-04 17:10:00', '2026-01-15 05:04:50.294244', 3);
INSERT INTO public.timesheet VALUES (11, '2025-11-05', '2025-11-05 08:00:00', '2025-11-05 17:00:00', '2026-01-15 05:04:50.294244', 3);
INSERT INTO public.timesheet VALUES (12, '2025-11-06', '2025-11-06 08:05:00', '2025-11-06 18:20:00', '2026-01-15 05:04:50.294244', 2);
INSERT INTO public.timesheet VALUES (13, '2025-11-06', '2025-11-06 07:55:00', '2025-11-06 17:45:00', '2026-01-15 05:04:50.294244', 3);
INSERT INTO public.timesheet VALUES (14, '2025-11-07', '2025-11-07 08:00:00', '2025-11-07 18:00:00', '2026-01-15 05:04:50.294244', 2);
INSERT INTO public.timesheet VALUES (15, '2025-11-07', '2025-11-07 08:08:00', '2025-11-07 17:55:00', '2026-01-15 05:04:50.294244', 3);
INSERT INTO public.timesheet VALUES (16, '2025-11-10', '2025-11-10 08:00:00', '2025-11-10 12:00:00', '2026-01-15 05:04:50.294244', 1);
INSERT INTO public.timesheet VALUES (17, '2025-11-10', '2025-11-10 13:00:00', '2025-11-10 18:00:00', '2026-01-15 05:04:50.294244', 1);
INSERT INTO public.timesheet VALUES (18, '2025-11-11', '2025-11-11 08:00:00', '2025-11-11 12:00:00', '2026-01-15 05:04:50.294244', 1);
INSERT INTO public.timesheet VALUES (19, '2025-11-11', '2025-11-11 13:00:00', '2025-11-11 14:00:00', '2026-01-15 05:04:50.294244', 1);
INSERT INTO public.timesheet VALUES (20, '2025-11-12', '2025-11-12 08:00:00', '2025-11-12 16:45:00', '2026-01-15 05:04:50.294244', 1);
INSERT INTO public.timesheet VALUES (21, '2025-11-13', '2025-11-13 08:00:00', '2025-11-13 12:45:00', '2026-01-15 05:04:50.294244', 1);
INSERT INTO public.timesheet VALUES (22, '2025-11-14', '2025-11-14 08:00:00', '2025-11-14 12:30:00', '2026-01-15 05:04:50.294244', 1);
INSERT INTO public.timesheet VALUES (23, '2025-11-12', '2025-11-12 08:10:00', '2025-11-12 17:45:00', '2026-01-15 05:04:50.294244', 2);
INSERT INTO public.timesheet VALUES (24, '2025-11-13', '2025-11-13 08:00:00', '2025-11-13 17:00:00', '2026-01-15 05:04:50.294244', 2);
INSERT INTO public.timesheet VALUES (25, '2025-11-14', '2025-11-14 08:05:00', '2025-11-14 17:20:00', '2026-01-15 05:04:50.294244', 2);
INSERT INTO public.timesheet VALUES (26, '2025-11-10', '2025-11-10 08:10:00', '2025-11-10 18:10:00', '2026-01-15 05:04:50.299233', 2);
INSERT INTO public.timesheet VALUES (27, '2025-11-10', '2025-11-10 07:52:00', '2025-11-10 17:42:00', '2026-01-15 05:04:50.299233', 3);
INSERT INTO public.timesheet VALUES (28, '2025-11-11', '2025-11-11 08:03:00', '2025-11-11 17:00:00', '2026-01-15 05:04:50.299233', 1);
INSERT INTO public.timesheet VALUES (29, '2025-11-11', '2025-11-11 08:12:00', '2025-11-11 18:25:00', '2026-01-15 05:04:50.299233', 2);
INSERT INTO public.timesheet VALUES (30, '2025-11-11', '2025-11-11 08:05:00', '2025-11-11 17:50:00', '2026-01-15 05:04:50.299233', 3);
INSERT INTO public.timesheet VALUES (31, '2025-11-12', '2025-11-12 08:08:00', '2025-11-12 18:00:00', '2026-01-15 05:04:50.299233', 2);
INSERT INTO public.timesheet VALUES (32, '2025-11-12', '2025-11-12 08:00:00', '2025-11-12 17:30:00', '2026-01-15 05:04:50.299233', 3);
INSERT INTO public.timesheet VALUES (33, '2025-11-13', '2025-11-13 08:10:00', '2025-11-13 18:20:00', '2026-01-15 05:04:50.299233', 2);
INSERT INTO public.timesheet VALUES (34, '2025-11-13', '2025-11-13 07:58:00', '2025-11-13 17:00:00', '2026-01-15 05:04:50.299233', 3);
INSERT INTO public.timesheet VALUES (35, '2025-11-14', '2025-11-14 08:15:00', '2025-11-14 18:12:00', '2026-01-15 05:04:50.299233', 2);
INSERT INTO public.timesheet VALUES (36, '2025-11-14', '2025-11-14 08:10:00', '2025-11-14 17:38:00', '2026-01-15 05:04:50.299233', 3);
INSERT INTO public.timesheet VALUES (37, '2025-11-17', '2025-11-17 07:55:00', '2025-11-17 17:30:00', '2026-01-15 05:04:50.300764', 1);
INSERT INTO public.timesheet VALUES (38, '2025-11-17', '2025-11-17 08:12:00', '2025-11-17 18:00:00', '2026-01-15 05:04:50.300764', 2);
INSERT INTO public.timesheet VALUES (39, '2025-11-17', '2025-11-17 08:00:00', '2025-11-17 17:45:00', '2026-01-15 05:04:50.300764', 3);
INSERT INTO public.timesheet VALUES (40, '2025-11-18', '2025-11-18 07:57:00', '2025-11-18 17:00:00', '2026-01-15 05:04:50.300764', 1);
INSERT INTO public.timesheet VALUES (41, '2025-11-18', '2025-11-18 08:05:00', '2025-11-18 18:15:00', '2026-01-15 05:04:50.300764', 2);
INSERT INTO public.timesheet VALUES (42, '2025-11-18', '2025-11-18 08:10:00', '2025-11-18 17:33:00', '2026-01-15 05:04:50.300764', 3);
INSERT INTO public.timesheet VALUES (43, '2025-11-19', '2025-11-19 08:05:00', '2025-11-19 17:10:00', '2026-01-15 05:04:50.300764', 1);
INSERT INTO public.timesheet VALUES (44, '2025-11-19', '2025-11-19 08:14:00', '2025-11-19 18:08:00', '2026-01-15 05:04:50.300764', 2);
INSERT INTO public.timesheet VALUES (45, '2025-11-19', '2025-11-19 07:55:00', '2025-11-19 17:58:00', '2026-01-15 05:04:50.300764', 3);
INSERT INTO public.timesheet VALUES (46, '2025-11-20', '2025-11-20 07:50:00', '2025-11-20 17:00:00', '2026-01-15 05:04:50.300764', 1);
INSERT INTO public.timesheet VALUES (47, '2025-11-20', '2025-11-20 08:10:00', '2025-11-20 18:00:00', '2026-01-15 05:04:50.300764', 2);
INSERT INTO public.timesheet VALUES (48, '2025-11-20', '2025-11-20 08:05:00', '2025-11-20 17:45:00', '2026-01-15 05:04:50.300764', 3);
INSERT INTO public.timesheet VALUES (49, '2025-11-21', '2025-11-21 08:02:00', '2025-11-21 17:22:00', '2026-01-15 05:04:50.300764', 1);
INSERT INTO public.timesheet VALUES (50, '2025-11-21', '2025-11-21 08:12:00', '2025-11-21 18:05:00', '2026-01-15 05:04:50.300764', 2);
INSERT INTO public.timesheet VALUES (51, '2025-11-21', '2025-11-21 07:57:00', '2025-11-21 17:37:00', '2026-01-15 05:04:50.300764', 3);
INSERT INTO public.timesheet VALUES (52, '2025-11-24', '2025-11-24 07:55:00', '2025-11-24 17:10:00', '2026-01-15 05:04:50.302182', 1);
INSERT INTO public.timesheet VALUES (53, '2025-11-24', '2025-11-24 08:00:00', '2025-11-24 18:20:00', '2026-01-15 05:04:50.302182', 2);
INSERT INTO public.timesheet VALUES (54, '2025-11-24', '2025-11-24 07:50:00', '2025-11-24 17:30:00', '2026-01-15 05:04:50.302182', 3);
INSERT INTO public.timesheet VALUES (55, '2025-11-25', '2025-11-25 08:00:00', '2025-11-25 17:00:00', '2026-01-15 05:04:50.302182', 1);
INSERT INTO public.timesheet VALUES (56, '2025-11-25', '2025-11-25 07:59:00', '2025-11-25 18:08:00', '2026-01-15 05:04:50.302182', 2);
INSERT INTO public.timesheet VALUES (57, '2025-11-25', '2025-11-25 07:55:00', '2025-11-25 17:48:00', '2026-01-15 05:04:50.302182', 3);
INSERT INTO public.timesheet VALUES (58, '2025-11-26', '2025-11-26 07:58:00', '2025-11-26 17:15:00', '2026-01-15 05:04:50.302182', 1);
INSERT INTO public.timesheet VALUES (59, '2025-11-26', '2025-11-26 08:00:00', '2025-11-26 18:00:00', '2026-01-15 05:04:50.302182', 2);
INSERT INTO public.timesheet VALUES (60, '2025-11-26', '2025-11-26 08:05:00', '2025-11-26 17:41:00', '2026-01-15 05:04:50.302182', 3);
INSERT INTO public.timesheet VALUES (61, '2025-11-27', '2025-11-27 08:03:00', '2025-11-27 17:00:00', '2026-01-15 05:04:50.302182', 1);
INSERT INTO public.timesheet VALUES (62, '2025-11-27', '2025-11-27 07:50:00', '2025-11-27 18:10:00', '2026-01-15 05:04:50.302182', 2);
INSERT INTO public.timesheet VALUES (63, '2025-11-27', '2025-11-27 07:58:00', '2025-11-27 17:55:00', '2026-01-15 05:04:50.302182', 3);
INSERT INTO public.timesheet VALUES (64, '2025-11-28', '2025-11-28 07:50:00', '2025-11-28 17:23:00', '2026-01-15 05:04:50.302182', 1);
INSERT INTO public.timesheet VALUES (65, '2025-11-28', '2025-11-28 07:45:00', '2025-11-28 18:00:00', '2026-01-15 05:04:50.302182', 2);
INSERT INTO public.timesheet VALUES (66, '2025-11-28', '2025-11-28 08:00:00', '2025-11-28 17:40:00', '2026-01-15 05:04:50.302182', 3);
INSERT INTO public.timesheet VALUES (67, '2025-12-01', '2025-12-01 07:55:00', '2025-12-01 17:12:00', '2026-01-15 05:04:50.30343', 1);
INSERT INTO public.timesheet VALUES (68, '2025-12-01', '2025-12-01 07:55:00', '2025-12-01 18:10:00', '2026-01-15 05:04:50.30343', 2);
INSERT INTO public.timesheet VALUES (69, '2025-12-01', '2025-12-01 08:05:00', '2025-12-01 17:40:00', '2026-01-15 05:04:50.30343', 3);
INSERT INTO public.timesheet VALUES (70, '2025-12-02', '2025-12-02 07:58:00', '2025-12-02 17:00:00', '2026-01-15 05:04:50.30343', 1);
INSERT INTO public.timesheet VALUES (71, '2025-12-02', '2025-12-02 08:00:00', '2025-12-02 18:20:00', '2026-01-15 05:04:50.30343', 2);
INSERT INTO public.timesheet VALUES (72, '2025-12-02', '2025-12-02 07:52:00', '2025-12-02 17:55:00', '2026-01-15 05:04:50.30343', 3);
INSERT INTO public.timesheet VALUES (73, '2025-12-03', '2025-12-03 08:00:00', '2025-12-03 17:18:00', '2026-01-15 05:04:50.30343', 1);
INSERT INTO public.timesheet VALUES (74, '2025-12-03', '2025-12-03 08:12:00', '2025-12-03 18:00:00', '2026-01-15 05:04:50.30343', 2);
INSERT INTO public.timesheet VALUES (75, '2025-12-03', '2025-12-03 07:55:00', '2025-12-03 17:33:00', '2026-01-15 05:04:50.30343', 3);
INSERT INTO public.timesheet VALUES (76, '2025-12-04', '2025-12-04 07:50:00', '2025-12-04 17:00:00', '2026-01-15 05:04:50.30343', 1);
INSERT INTO public.timesheet VALUES (77, '2025-12-04', '2025-12-04 08:00:00', '2025-12-04 18:12:00', '2026-01-15 05:04:50.30343', 2);
INSERT INTO public.timesheet VALUES (78, '2025-12-04', '2025-12-04 08:05:00', '2025-12-04 17:48:00', '2026-01-15 05:04:50.30343', 3);
INSERT INTO public.timesheet VALUES (79, '2025-12-05', '2025-12-05 07:57:00', '2025-12-05 17:25:00', '2026-01-15 05:04:50.30343', 1);
INSERT INTO public.timesheet VALUES (80, '2025-12-05', '2025-12-05 08:05:00', '2025-12-05 18:00:00', '2026-01-15 05:04:50.30343', 2);
INSERT INTO public.timesheet VALUES (81, '2025-12-05', '2025-12-05 07:54:00', '2025-12-05 17:50:00', '2026-01-15 05:04:50.30343', 3);
INSERT INTO public.timesheet VALUES (82, '2026-01-05', '2026-01-05 07:55:00', '2026-01-05 17:10:00', '2026-01-15 05:04:50.326085', 1);
INSERT INTO public.timesheet VALUES (83, '2026-01-05', '2026-01-05 08:00:00', '2026-01-05 18:15:00', '2026-01-15 05:04:50.326085', 2);
INSERT INTO public.timesheet VALUES (84, '2026-01-05', '2026-01-05 08:05:00', '2026-01-05 17:40:00', '2026-01-15 05:04:50.326085', 3);
INSERT INTO public.timesheet VALUES (85, '2026-01-06', '2026-01-06 07:58:00', '2026-01-06 17:20:00', '2026-01-15 05:04:50.326085', 1);
INSERT INTO public.timesheet VALUES (86, '2026-01-06', '2026-01-06 08:10:00', '2026-01-06 18:00:00', '2026-01-15 05:04:50.326085', 2);
INSERT INTO public.timesheet VALUES (87, '2026-01-06', '2026-01-06 07:55:00', '2026-01-06 17:35:00', '2026-01-15 05:04:50.326085', 3);
INSERT INTO public.timesheet VALUES (88, '2026-01-07', '2026-01-07 08:00:00', '2026-01-07 17:15:00', '2026-01-15 05:04:50.326085', 1);
INSERT INTO public.timesheet VALUES (89, '2026-01-07', '2026-01-07 08:05:00', '2026-01-07 18:20:00', '2026-01-15 05:04:50.326085', 2);
INSERT INTO public.timesheet VALUES (90, '2026-01-07', '2026-01-07 08:00:00', '2026-01-07 17:45:00', '2026-01-15 05:04:50.326085', 3);
INSERT INTO public.timesheet VALUES (91, '2026-01-08', '2026-01-08 07:52:00', '2026-01-08 17:00:00', '2026-01-15 05:04:50.326085', 1);
INSERT INTO public.timesheet VALUES (92, '2026-01-08', '2026-01-08 08:00:00', '2026-01-08 18:10:00', '2026-01-15 05:04:50.326085', 2);
INSERT INTO public.timesheet VALUES (93, '2026-01-08', '2026-01-08 07:58:00', '2026-01-08 17:50:00', '2026-01-15 05:04:50.326085', 3);
INSERT INTO public.timesheet VALUES (94, '2026-01-09', '2026-01-09 08:05:00', '2026-01-09 17:25:00', '2026-01-15 05:04:50.326085', 1);
INSERT INTO public.timesheet VALUES (95, '2026-01-09', '2026-01-09 08:12:00', '2026-01-09 18:00:00', '2026-01-15 05:04:50.326085', 2);
INSERT INTO public.timesheet VALUES (96, '2026-01-09', '2026-01-09 08:02:00', '2026-01-09 17:30:00', '2026-01-15 05:04:50.326085', 3);
INSERT INTO public.timesheet VALUES (97, '2026-01-12', '2026-01-12 07:50:00', '2026-01-12 17:00:00', '2026-01-15 05:04:50.328695', 1);
INSERT INTO public.timesheet VALUES (98, '2026-01-12', '2026-01-12 08:00:00', '2026-01-12 18:05:00', '2026-01-15 05:04:50.328695', 2);
INSERT INTO public.timesheet VALUES (99, '2026-01-12', '2026-01-12 07:55:00', '2026-01-12 17:40:00', '2026-01-15 05:04:50.328695', 3);
INSERT INTO public.timesheet VALUES (100, '2026-01-13', '2026-01-13 08:00:00', '2026-01-13 17:18:00', '2026-01-15 05:04:50.328695', 1);
INSERT INTO public.timesheet VALUES (101, '2026-01-13', '2026-01-13 08:08:00', '2026-01-13 18:15:00', '2026-01-15 05:04:50.328695', 2);
INSERT INTO public.timesheet VALUES (102, '2026-01-13', '2026-01-13 08:00:00', '2026-01-13 17:35:00', '2026-01-15 05:04:50.328695', 3);
INSERT INTO public.timesheet VALUES (103, '2026-01-14', '2026-01-14 07:55:00', '2026-01-14 17:10:00', '2026-01-15 05:04:50.328695', 1);
INSERT INTO public.timesheet VALUES (104, '2026-01-14', '2026-01-14 08:05:00', '2026-01-14 18:00:00', '2026-01-15 05:04:50.328695', 2);
INSERT INTO public.timesheet VALUES (105, '2026-01-14', '2026-01-14 07:58:00', '2026-01-14 17:45:00', '2026-01-15 05:04:50.328695', 3);
INSERT INTO public.timesheet VALUES (106, '2026-01-15', '2026-01-15 08:02:00', '2026-01-15 17:22:00', '2026-01-15 05:04:50.328695', 1);
INSERT INTO public.timesheet VALUES (107, '2026-01-15', '2026-01-15 08:10:00', '2026-01-15 18:20:00', '2026-01-15 05:04:50.328695', 2);
INSERT INTO public.timesheet VALUES (108, '2026-01-15', '2026-01-15 08:05:00', '2026-01-15 17:50:00', '2026-01-15 05:04:50.328695', 3);
INSERT INTO public.timesheet VALUES (109, '2026-01-16', '2026-01-16 07:58:00', '2026-01-16 17:15:00', '2026-01-15 05:04:50.328695', 1);
INSERT INTO public.timesheet VALUES (110, '2026-01-16', '2026-01-16 08:00:00', '2026-01-16 18:10:00', '2026-01-15 05:04:50.328695', 2);
INSERT INTO public.timesheet VALUES (111, '2026-01-16', '2026-01-16 08:00:00', '2026-01-16 17:30:00', '2026-01-15 05:04:50.328695', 3);
INSERT INTO public.timesheet VALUES (112, '2026-01-19', '2026-01-19 07:55:00', '2026-01-19 17:20:00', '2026-01-15 05:04:50.330949', 1);
INSERT INTO public.timesheet VALUES (113, '2026-01-19', '2026-01-19 08:05:00', '2026-01-19 18:00:00', '2026-01-15 05:04:50.330949', 2);
INSERT INTO public.timesheet VALUES (114, '2026-01-19', '2026-01-19 07:58:00', '2026-01-19 17:35:00', '2026-01-15 05:04:50.330949', 3);
INSERT INTO public.timesheet VALUES (115, '2026-01-20', '2026-01-20 08:00:00', '2026-01-20 17:10:00', '2026-01-15 05:04:50.330949', 1);
INSERT INTO public.timesheet VALUES (116, '2026-01-20', '2026-01-20 08:10:00', '2026-01-20 18:15:00', '2026-01-15 05:04:50.330949', 2);
INSERT INTO public.timesheet VALUES (117, '2026-01-20', '2026-01-20 08:02:00', '2026-01-20 17:45:00', '2026-01-15 05:04:50.330949', 3);
INSERT INTO public.timesheet VALUES (118, '2026-01-21', '2026-01-21 07:52:00', '2026-01-21 17:00:00', '2026-01-15 05:04:50.330949', 1);
INSERT INTO public.timesheet VALUES (119, '2026-01-21', '2026-01-21 08:00:00', '2026-01-21 18:20:00', '2026-01-15 05:04:50.330949', 2);
INSERT INTO public.timesheet VALUES (120, '2026-01-21', '2026-01-21 07:55:00', '2026-01-21 17:40:00', '2026-01-15 05:04:50.330949', 3);
INSERT INTO public.timesheet VALUES (121, '2026-01-22', '2026-01-22 08:05:00', '2026-01-22 17:25:00', '2026-01-15 05:04:50.330949', 1);
INSERT INTO public.timesheet VALUES (122, '2026-01-22', '2026-01-22 08:08:00', '2026-01-22 18:00:00', '2026-01-15 05:04:50.330949', 2);
INSERT INTO public.timesheet VALUES (123, '2026-01-22', '2026-01-22 08:00:00', '2026-01-22 17:50:00', '2026-01-15 05:04:50.330949', 3);
INSERT INTO public.timesheet VALUES (124, '2026-01-23', '2026-01-23 07:58:00', '2026-01-23 17:15:00', '2026-01-15 05:04:50.330949', 1);
INSERT INTO public.timesheet VALUES (125, '2026-01-23', '2026-01-23 08:05:00', '2026-01-23 18:10:00', '2026-01-15 05:04:50.330949', 2);
INSERT INTO public.timesheet VALUES (126, '2026-01-23', '2026-01-23 07:58:00', '2026-01-23 17:35:00', '2026-01-15 05:04:50.330949', 3);
INSERT INTO public.timesheet VALUES (127, '2026-01-26', '2026-01-26 07:55:00', '2026-01-26 17:10:00', '2026-01-15 05:04:50.334141', 1);
INSERT INTO public.timesheet VALUES (128, '2026-01-26', '2026-01-26 08:00:00', '2026-01-26 18:05:00', '2026-01-15 05:04:50.334141', 2);
INSERT INTO public.timesheet VALUES (129, '2026-01-26', '2026-01-26 08:02:00', '2026-01-26 17:40:00', '2026-01-15 05:04:50.334141', 3);
INSERT INTO public.timesheet VALUES (130, '2026-01-27', '2026-01-27 08:00:00', '2026-01-27 17:20:00', '2026-01-15 05:04:50.334141', 1);
INSERT INTO public.timesheet VALUES (131, '2026-01-27', '2026-01-27 08:10:00', '2026-01-27 18:15:00', '2026-01-15 05:04:50.334141', 2);
INSERT INTO public.timesheet VALUES (132, '2026-01-27', '2026-01-27 07:55:00', '2026-01-27 17:45:00', '2026-01-15 05:04:50.334141', 3);
INSERT INTO public.timesheet VALUES (133, '2026-01-28', '2026-01-28 07:52:00', '2026-01-28 17:00:00', '2026-01-15 05:04:50.334141', 1);
INSERT INTO public.timesheet VALUES (134, '2026-01-28', '2026-01-28 08:05:00', '2026-01-28 18:20:00', '2026-01-15 05:04:50.334141', 2);
INSERT INTO public.timesheet VALUES (135, '2026-01-28', '2026-01-28 08:00:00', '2026-01-28 17:35:00', '2026-01-15 05:04:50.334141', 3);
INSERT INTO public.timesheet VALUES (136, '2026-01-29', '2026-01-29 08:05:00', '2026-01-29 17:25:00', '2026-01-15 05:04:50.334141', 1);
INSERT INTO public.timesheet VALUES (137, '2026-01-29', '2026-01-29 08:00:00', '2026-01-29 18:00:00', '2026-01-15 05:04:50.334141', 2);
INSERT INTO public.timesheet VALUES (138, '2026-01-29', '2026-01-29 07:58:00', '2026-01-29 17:50:00', '2026-01-15 05:04:50.334141', 3);
INSERT INTO public.timesheet VALUES (139, '2026-01-30', '2026-01-30 07:58:00', '2026-01-30 17:18:00', '2026-01-15 05:04:50.334141', 1);
INSERT INTO public.timesheet VALUES (140, '2026-01-30', '2026-01-30 08:08:00', '2026-01-30 18:10:00', '2026-01-15 05:04:50.334141', 2);
INSERT INTO public.timesheet VALUES (141, '2026-01-30', '2026-01-30 08:02:00', '2026-01-30 17:30:00', '2026-01-15 05:04:50.334141', 3);


--
-- Name: employee_account_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_account_id_seq', 5, true);


--
-- Name: freelance_contract_contract_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.freelance_contract_contract_id_seq', 2, true);


--
-- Name: freelance_payslip_payslip_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.freelance_payslip_payslip_id_seq', 2, true);


--
-- Name: fulltime_contract_contract_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fulltime_contract_contract_id_seq', 3, true);


--
-- Name: fulltime_payslip_payslip_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.fulltime_payslip_payslip_id_seq', 8, true);


--
-- Name: leave_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_request_id_seq', 4, true);


--
-- Name: payroll_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payroll_id_seq', 7, true);


--
-- Name: timesheet_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.timesheet_id_seq', 141, true);


--
-- Name: employee_account employee_account_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_account
    ADD CONSTRAINT employee_account_email_key UNIQUE (email);


--
-- Name: employee_account employee_account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_account
    ADD CONSTRAINT employee_account_pkey PRIMARY KEY (id);


--
-- Name: employee_account employee_account_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_account
    ADD CONSTRAINT employee_account_username_key UNIQUE (username);


--
-- Name: freelance_actual_bonus freelance_actual_bonus_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelance_actual_bonus
    ADD CONSTRAINT freelance_actual_bonus_pkey PRIMARY KEY (payslip_id, stt);


--
-- Name: freelance_actual_penalty freelance_actual_penalty_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelance_actual_penalty
    ADD CONSTRAINT freelance_actual_penalty_pkey PRIMARY KEY (payslip_id, stt);


--
-- Name: freelance_contract_bonus freelance_contract_bonus_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelance_contract_bonus
    ADD CONSTRAINT freelance_contract_bonus_pkey PRIMARY KEY (contract_id, stt);


--
-- Name: freelance_contract_penalty freelance_contract_penalty_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelance_contract_penalty
    ADD CONSTRAINT freelance_contract_penalty_pkey PRIMARY KEY (contract_id, stt);


--
-- Name: freelance_contract freelance_contract_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelance_contract
    ADD CONSTRAINT freelance_contract_pkey PRIMARY KEY (contract_id);


--
-- Name: freelance_payslip freelance_payslip_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelance_payslip
    ADD CONSTRAINT freelance_payslip_pkey PRIMARY KEY (payslip_id);


--
-- Name: fulltime_actual_allowance fulltime_actual_allowance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_actual_allowance
    ADD CONSTRAINT fulltime_actual_allowance_pkey PRIMARY KEY (payslip_id, stt);


--
-- Name: fulltime_actual_bonus fulltime_actual_bonus_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_actual_bonus
    ADD CONSTRAINT fulltime_actual_bonus_pkey PRIMARY KEY (payslip_id, stt);


--
-- Name: fulltime_contract_allowance fulltime_contract_allowance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_contract_allowance
    ADD CONSTRAINT fulltime_contract_allowance_pkey PRIMARY KEY (contract_id, stt);


--
-- Name: fulltime_contract_bonus fulltime_contract_bonus_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_contract_bonus
    ADD CONSTRAINT fulltime_contract_bonus_pkey PRIMARY KEY (contract_id, stt);


--
-- Name: fulltime_contract_deduction fulltime_contract_deduction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_contract_deduction
    ADD CONSTRAINT fulltime_contract_deduction_pkey PRIMARY KEY (contract_id, stt);


--
-- Name: fulltime_contract fulltime_contract_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_contract
    ADD CONSTRAINT fulltime_contract_pkey PRIMARY KEY (contract_id);


--
-- Name: fulltime_contract_workday fulltime_contract_workday_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_contract_workday
    ADD CONSTRAINT fulltime_contract_workday_pkey PRIMARY KEY (contract_id, day);


--
-- Name: fulltime_payslip_deduction fulltime_payslip_deduction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_payslip_deduction
    ADD CONSTRAINT fulltime_payslip_deduction_pkey PRIMARY KEY (payslip_id, stt);


--
-- Name: fulltime_payslip fulltime_payslip_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_payslip
    ADD CONSTRAINT fulltime_payslip_pkey PRIMARY KEY (payslip_id);


--
-- Name: hr hr_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr
    ADD CONSTRAINT hr_pkey PRIMARY KEY (id);


--
-- Name: leave_request_cancel leave_request_cancel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_request_cancel
    ADD CONSTRAINT leave_request_cancel_pkey PRIMARY KEY (leave_request_id);


--
-- Name: leave_request leave_request_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_request
    ADD CONSTRAINT leave_request_pkey PRIMARY KEY (id);


--
-- Name: payroll payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_pkey PRIMARY KEY (id);


--
-- Name: timesheet timesheet_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timesheet
    ADD CONSTRAINT timesheet_pkey PRIMARY KEY (id);


--
-- Name: idx_employee_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_status ON public.employee_account USING btree (status);


--
-- Name: idx_employee_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_employee_type ON public.employee_account USING btree (type);


--
-- Name: idx_freelance_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_freelance_employee ON public.freelance_contract USING btree (employee_id);


--
-- Name: idx_fulltime_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fulltime_employee ON public.fulltime_contract USING btree (employee_id);


--
-- Name: idx_leave_request_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_request_employee ON public.leave_request USING btree (employee_create);


--
-- Name: idx_payroll_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_period ON public.payroll USING btree (year, month);


--
-- Name: idx_timesheet_employee_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_timesheet_employee_date ON public.timesheet USING btree (employee_id, date);


--
-- Name: freelance_actual_bonus freelance_actual_bonus_payslip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelance_actual_bonus
    ADD CONSTRAINT freelance_actual_bonus_payslip_id_fkey FOREIGN KEY (payslip_id) REFERENCES public.freelance_payslip(payslip_id);


--
-- Name: freelance_actual_penalty freelance_actual_penalty_payslip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelance_actual_penalty
    ADD CONSTRAINT freelance_actual_penalty_payslip_id_fkey FOREIGN KEY (payslip_id) REFERENCES public.freelance_payslip(payslip_id);


--
-- Name: freelance_contract_bonus freelance_contract_bonus_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelance_contract_bonus
    ADD CONSTRAINT freelance_contract_bonus_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.freelance_contract(contract_id);


--
-- Name: freelance_contract freelance_contract_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelance_contract
    ADD CONSTRAINT freelance_contract_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee_account(id);


--
-- Name: freelance_contract_penalty freelance_contract_penalty_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelance_contract_penalty
    ADD CONSTRAINT freelance_contract_penalty_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.freelance_contract(contract_id);


--
-- Name: freelance_payslip freelance_payslip_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelance_payslip
    ADD CONSTRAINT freelance_payslip_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.freelance_contract(contract_id);


--
-- Name: freelance_payslip freelance_payslip_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelance_payslip
    ADD CONSTRAINT freelance_payslip_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee_account(id);


--
-- Name: freelance_payslip freelance_payslip_payroll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.freelance_payslip
    ADD CONSTRAINT freelance_payslip_payroll_id_fkey FOREIGN KEY (payroll_id) REFERENCES public.payroll(id);


--
-- Name: fulltime_actual_allowance fulltime_actual_allowance_payslip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_actual_allowance
    ADD CONSTRAINT fulltime_actual_allowance_payslip_id_fkey FOREIGN KEY (payslip_id) REFERENCES public.fulltime_payslip(payslip_id);


--
-- Name: fulltime_actual_bonus fulltime_actual_bonus_payslip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_actual_bonus
    ADD CONSTRAINT fulltime_actual_bonus_payslip_id_fkey FOREIGN KEY (payslip_id) REFERENCES public.fulltime_payslip(payslip_id);


--
-- Name: fulltime_contract_allowance fulltime_contract_allowance_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_contract_allowance
    ADD CONSTRAINT fulltime_contract_allowance_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.fulltime_contract(contract_id);


--
-- Name: fulltime_contract_bonus fulltime_contract_bonus_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_contract_bonus
    ADD CONSTRAINT fulltime_contract_bonus_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.fulltime_contract(contract_id);


--
-- Name: fulltime_contract_deduction fulltime_contract_deduction_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_contract_deduction
    ADD CONSTRAINT fulltime_contract_deduction_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.fulltime_contract(contract_id);


--
-- Name: fulltime_contract fulltime_contract_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_contract
    ADD CONSTRAINT fulltime_contract_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee_account(id);


--
-- Name: fulltime_contract_workday fulltime_contract_workday_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_contract_workday
    ADD CONSTRAINT fulltime_contract_workday_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.fulltime_contract(contract_id);


--
-- Name: fulltime_payslip fulltime_payslip_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_payslip
    ADD CONSTRAINT fulltime_payslip_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.fulltime_contract(contract_id);


--
-- Name: fulltime_payslip_deduction fulltime_payslip_deduction_payslip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_payslip_deduction
    ADD CONSTRAINT fulltime_payslip_deduction_payslip_id_fkey FOREIGN KEY (payslip_id) REFERENCES public.fulltime_payslip(payslip_id);


--
-- Name: fulltime_payslip fulltime_payslip_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_payslip
    ADD CONSTRAINT fulltime_payslip_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee_account(id);


--
-- Name: fulltime_payslip fulltime_payslip_payroll_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fulltime_payslip
    ADD CONSTRAINT fulltime_payslip_payroll_id_fkey FOREIGN KEY (payroll_id) REFERENCES public.payroll(id);


--
-- Name: hr hr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hr
    ADD CONSTRAINT hr_id_fkey FOREIGN KEY (id) REFERENCES public.employee_account(id);


--
-- Name: leave_request_cancel leave_request_cancel_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_request_cancel
    ADD CONSTRAINT leave_request_cancel_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee_account(id);


--
-- Name: leave_request_cancel leave_request_cancel_hr_approve_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_request_cancel
    ADD CONSTRAINT leave_request_cancel_hr_approve_fkey FOREIGN KEY (hr_approve) REFERENCES public.hr(id);


--
-- Name: leave_request_cancel leave_request_cancel_leave_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_request_cancel
    ADD CONSTRAINT leave_request_cancel_leave_request_id_fkey FOREIGN KEY (leave_request_id) REFERENCES public.leave_request(id);


--
-- Name: leave_request leave_request_employee_create_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_request
    ADD CONSTRAINT leave_request_employee_create_fkey FOREIGN KEY (employee_create) REFERENCES public.employee_account(id);


--
-- Name: leave_request leave_request_hr_approve_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_request
    ADD CONSTRAINT leave_request_hr_approve_fkey FOREIGN KEY (hr_approve) REFERENCES public.hr(id);


--
-- Name: payroll payroll_hr_approve_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll
    ADD CONSTRAINT payroll_hr_approve_fkey FOREIGN KEY (hr_approve) REFERENCES public.hr(id);


--
-- Name: timesheet timesheet_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timesheet
    ADD CONSTRAINT timesheet_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee_account(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--