-- Setup script for School Portal database
-- Run this script on your MySQL database to create the required tables
-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_user_sessions_user_id (user_id),
    INDEX idx_user_sessions_expires_at (expires_at)
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
        'insert'
    ) NOT NULL,
    details JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_processing_log_user_id (user_id),
    INDEX idx_processing_log_timestamp (timestamp),
    INDEX idx_processing_log_action_type (action_type)
);
-- Create a default user for testing (password is 'password123' hashed with bcrypt)
INSERT IGNORE INTO user (username, password)
VALUES (
        'admin',
        '$2b$12$TsyRPo8od1j8MgvkUFo2oe9rawyvPIN7aak9gRgbMiWyJCQPkbt4C'
    );
-- Show tables to verify creation
SHOW TABLES;