CREATE DATABASE IF NOT EXISTS labeler;
USE labeler;

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE,
  password VARCHAR(255),
  role ENUM('annotator','reviewer','admin')
);

CREATE TABLE images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  file VARCHAR(200),
  status ENUM('pending','labeled','review','completed') DEFAULT 'pending'
);

CREATE TABLE annotations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  image_id INT,
  user_id INT,
  label ENUM('cat','dog')
);

CREATE TABLE reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  annotation_id INT,
  reviewer_id INT,
  status ENUM('approved','rejected')
);
