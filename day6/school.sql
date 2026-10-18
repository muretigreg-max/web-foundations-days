
PRAGMA foreign_keys = ON;

CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_name TEXT NOT NULL,
    course_code TEXT NOT NULL UNIQUE
);

CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    UNIQUE (student_id, course_id)
);


-- Insert at least 3 students
INSERT INTO students (student_id, name, email) VALUES
(1, 'Alice Wanjiku', 'alice@example.com'),
(2, 'Brian Otieno', 'brian@example.com'),
(3, 'Carol Achieng', 'carol@example.com');

-- Insert at least 3 courses
INSERT INTO courses (course_id, course_name, course_code) VALUES
(1, 'Web Development', 'WEB101'),
(2, 'Database Systems', 'DBS101'),
(3, 'Computer Networks', 'NET101');

-- Insert at least 5 enrolments
INSERT INTO enrolments
    (enrolment_id, student_id, course_id, grade)
VALUES
(1, 1, 1, 'A'),
(2, 1, 2, 'B'),
(3, 2, 1, 'B'),
(4, 2, 3, 'A'),
(5, 3, 2, 'A'),
(6, 3, 3, NULL);


-- 1. All courses taken by one student, searched by name
SELECT s.name, c.course_name, e.grade
FROM students AS s
JOIN enrolments AS e ON s.student_id = e.student_id
JOIN courses AS c ON e.course_id = c.course_id
WHERE s.name = 'Alice Wanjiku';

-- 2. All students enrolled in one course
SELECT c.course_name, s.name, e.grade
FROM courses AS c
JOIN enrolments AS e ON c.course_id = e.course_id
JOIN students AS s ON e.student_id = s.student_id
WHERE c.course_name = 'Web Development';

-- 3. Number of students enrolled in each course
SELECT c.course_name, COUNT(e.student_id) AS student_count
FROM courses AS c
LEFT JOIN enrolments AS e ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_name;

-- 4. Students who have no enrolments
SELECT s.name, s.email
FROM students AS s
LEFT JOIN enrolments AS e ON s.student_id = e.student_id
WHERE e.enrolment_id IS NULL;

-- 5. Update one enrolment's grade
UPDATE enrolments
SET grade = 'A'
WHERE enrolment_id = 2;

-- Check the updated grade
SELECT *
FROM enrolments
WHERE enrolment_id = 2;
