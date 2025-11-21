# Database Migrations

This directory contains SQL migration files for database schema changes.

## Running Migrations

### Option 1: Using MySQL Command Line
```bash
mysql -u your_username -p your_database_name < migrations/001_create_assignment_answers_table.sql
```

### Option 2: Using MySQL Workbench or phpMyAdmin
1. Open the migration file
2. Copy the SQL content
3. Execute it in your database management tool

### Option 3: Using Sequelize Sync (Automatic)
The models are set up to automatically create tables when the server starts using `sequelize.sync()`. However, for production environments, it's recommended to use explicit migrations.

## Migration Files

### 001_create_assignment_answers_table.sql
Creates the `assignment_answers` table with:
- `id` (Primary Key, Auto Increment)
- `assignment_id` (Foreign Key to `assignments` table)
- `student_id` (Foreign Key to `students` table)
- `answers` (LONGTEXT for JSON or long text content)
- `score` (FLOAT, nullable)
- `createdAt` and `updatedAt` timestamps
- Unique constraint on `(assignment_id, student_id)` combination
- Indexes on `assignment_id` and `student_id` for performance
- CASCADE delete/update on foreign keys

## Notes

- Always backup your database before running migrations in production
- Test migrations in a development environment first
- The migration includes `IF NOT EXISTS` to prevent errors if the table already exists

