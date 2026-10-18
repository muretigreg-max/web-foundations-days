# School Database Design

## 1. Table Explanations

**Students table**

The `students` table stores information about each student. It contains a unique student ID, the student's name, and email address. The student ID is the primary key, while the email is required and must be unique to prevent duplicate student accounts.

**Courses table**

The `courses` table stores information about courses offered by the school. It contains a course ID, course name, and course code. The course ID is the primary key, and the course code must be unique.

**Enrolments table**

The `enrolments` table records which students take which courses. It contains an enrolment ID, student ID, course ID, and grade. The student ID and course ID are foreign keys referencing the `students` and `courses` tables. A unique constraint on the combination of student ID and course ID prevents a student from enrolling in the same course twice.

## 2. Relationships Between Tables

There is a one-to-many relationship between students and enrolments because one student can have several enrolments, while each enrolment belongs to one student. There is also a one-to-many relationship between courses and enrolments because one course can have many enrolments, while each enrolment refers to one course.

Students and courses have a many-to-many relationship because a student can take several courses, and each course can have several students. The `enrolments` table acts as a join table that connects students to courses. It is necessary to represent this relationship and store additional information, such as each student's grade for a particular course.

## 3. Recommended Index

I would add an index on the `course_id` column in the `enrolments` table. This would help the database find enrolments for a particular course more efficiently, especially when listing all students taking that course. Although primary keys and unique constraints create indexes automatically, this additional index can improve queries that filter or join using `course_id`.

Example:

```sql
CREATE INDEX idx_enrolments_course_id
ON enrolments(course_id);
```

## 4. SQL or NoSQL?

I would choose a relational SQL database such as SQLite for this school system. The data has clear relationships between students, courses, and enrolments, and each enrolment must reference an existing student and course. SQL supports primary keys, foreign keys, unique constraints, and transactions that help maintain data accuracy and consistency. It also makes it straightforward to retrieve related information using joins and aggregate queries. A NoSQL database could be useful for more flexible or unstructured data, but a relational database is a natural fit for this system.