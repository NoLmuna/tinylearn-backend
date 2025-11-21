-- Migration: Create assignment_answers table
-- Created: 2024-01-XX
-- Description: Creates the assignment_answers table with foreign key relationships to assignments and students

CREATE TABLE IF NOT EXISTS `assignment_answers` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `assignment_id` INT NOT NULL,
    `student_id` INT NOT NULL,
    `answers` LONGTEXT NULL COMMENT 'JSON or long text content for answers',
    `score` FLOAT NULL,
    `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_assignment_student` (`assignment_id`, `student_id`),
    INDEX `idx_assignment_id` (`assignment_id`),
    INDEX `idx_student_id` (`student_id`),
    CONSTRAINT `fk_assignment_answers_assignment` 
        FOREIGN KEY (`assignment_id`) 
        REFERENCES `assignments` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_assignment_answers_student` 
        FOREIGN KEY (`student_id`) 
        REFERENCES `students` (`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

