CREATE DATABASE mariadb;

USE mariadb;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    birth_date DATE,
    weight DECIMAL(5,2),        
    height DECIMAL(4,2),
    role VARCHAR(20) NOT NULL,
    image_url VARCHAR(255),      
    is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS modalities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(100),
    image_url VARCHAR(255),
    category VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description VARCHAR(100),
    slug VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS attendees (
    user_id INT NOT NULL,
    modality_id INT NOT NULL,
    PRIMARY KEY (user_id, modality_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (modality_id) REFERENCES modalities(id)
);
