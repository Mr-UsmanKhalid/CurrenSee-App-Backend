-- CurrenSee MySQL schema
-- Mirrors lib/core/database/db_helper.dart (previously local SQLite via sqflite)
-- Run this once against your MySQL server:
--   mysql -u root -p < db/schema.sql

CREATE DATABASE IF NOT EXISTS currensee
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE currensee;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  profile_picture_path VARCHAR(500) NULL,
  default_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS conversions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  amount DOUBLE NOT NULL,
  converted_amount DOUBLE NOT NULL,
  rate DOUBLE NOT NULL,
  date DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  base_currency VARCHAR(10) NOT NULL,
  target_currency VARCHAR(10) NOT NULL,
  threshold DOUBLE NOT NULL,
  `condition` ENUM('above', 'below') NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_triggered TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  type VARCHAR(20) NOT NULL DEFAULT 'system',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS preferences (
  user_id INT PRIMARY KEY,
  default_base_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  notifications_enabled TINYINT(1) NOT NULL DEFAULT 1,
  theme_mode VARCHAR(10) NOT NULL DEFAULT 'light',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  rating INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
