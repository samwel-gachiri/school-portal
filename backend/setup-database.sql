-- Setup script for School Portal database
-- Run this script on your MySQL database to create the required tables
-- Create user table first (if not exists)
CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_user_sessions_user_id (user_id),
    INDEX idx_user_sessions_expires_at (expires_at),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
-- Create processing_log table
CREATE TABLE IF NOT EXISTS processing_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action_type ENUM(
        'upload',
        'extract',
        'match',
        'confirm',
        'insert',
        'manual_payment'
    ) NOT NULL,
    details JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_processing_log_user_id (user_id),
    INDEX idx_processing_log_timestamp (timestamp),
    INDEX idx_processing_log_action_type (action_type),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
-- Create class table
CREATE TABLE IF NOT EXISTS class (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Create school table for tracking totals
CREATE TABLE IF NOT EXISTS school (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paid DECIMAL(15, 2) DEFAULT 0.00,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    year INT NOT NULL,
    term INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_year_term (year, term)
);
-- Create student table
CREATE TABLE IF NOT EXISTS student (
    adm INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    class_id INT,
    paycount INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_name (name),
    INDEX idx_student_class (class_id),
    FOREIGN KEY (class_id) REFERENCES class(id) ON DELETE
    SET NULL
);
-- Create payment table
CREATE TABLE IF NOT EXISTS payment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    adm INT NOT NULL,
    bank ENUM(
        'EQUITY',
        'KCB',
        'CHEQUE',
        'NCBA',
        'BANK_OF_AFRICA',
        'SIM_PAY'
    ) NOT NULL,
    ref VARCHAR(20),
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    balance DECIMAL(10, 2) NOT NULL,
    term INT NOT NULL,
    year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    INDEX idx_payment_adm (adm),
    INDEX idx_payment_ref (ref),
    INDEX idx_payment_date (date),
    INDEX idx_payment_term_year (term, year),
    UNIQUE KEY unique_ref_bank (ref, bank),
    FOREIGN KEY (adm) REFERENCES student(adm) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES user(id)
);
-- Create paycount table for payment tracking
CREATE TABLE IF NOT EXISTS paycount (
    id INT AUTO_INCREMENT PRIMARY KEY,
    adm INT NOT NULL,
    payment_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    balance DECIMAL(10, 2) NOT NULL,
    term INT NOT NULL,
    year INT NOT NULL,
    bank ENUM(
        'EQUITY',
        'KCB',
        'CHEQUE',
        'NCBA',
        'BANK_OF_AFRICA',
        'SIM_PAY'
    ) NOT NULL,
    ref VARCHAR(20),
    dop DATE NOT NULL,
    -- date of payment
    date_ass TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- date assigned/recorded
    INDEX idx_paycount_adm (adm),
    INDEX idx_paycount_payment (payment_id),
    INDEX idx_paycount_term_year (term, year),
    FOREIGN KEY (adm) REFERENCES student(adm) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payment(id) ON DELETE CASCADE
);
-- Create default admin users
INSERT IGNORE INTO user (username, password, role)
VALUES (
        'admin',
        '$2b$12$TsyRPo8od1j8MgvkUFo2oe9rawyvPIN7aak9gRgbMiWyJCQPkbt4C',
        'admin'
    ),
    (
        'peter',
        '$2b$12$TsyRPo8od1j8MgvkUFo2oe9rawyvPIN7aak9gRgbMiWyJCQPkbt4C',
        'admin'
    ),
    (
        'jane',
        '$2b$12$TsyRPo8od1j8MgvkUFo2oe9rawyvPIN7aak9gRgbMiWyJCQPkbt4C',
        'admin'
    );
-- Create default classes
INSERT IGNORE INTO class (id, name)
VALUES (1, 'Form 1'),
    (2, 'Form 2'),
    (3, 'Form 3'),
    (4, 'Form 4');
-- Create current school year/term record
INSERT IGNORE INTO school (year, term)
VALUES (2024, 1);
-- Show tables to verify creation
SHOW TABLES;