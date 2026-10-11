
# Library Books REST API Design

## Overview

This API manages books in a library system. It supports listing books, retrieving an individual book, creating, updating and deleting books, and finding books by a particular author.

**Base URL:** `/api/books`

## Book Resource

Each book has the following fields:

- `id`: Unique identifier for the book.
- `title`: Title of the book.
- `author`: Name of the author.
- `publishedYear`: Year the book was published.
- `available`: Whether the book is available for borrowing.

## Endpoints

### 1. List All Books

- **Method:** `GET`
- **Path:** `/api/books`
- **Description:** Returns a list of all books in the library.
- **Success status:** `200 OK`
- **Request body:** Not required.

Example request:

```http
GET /api/books
```

### 2. Get One Book

- **Method:** `GET`
- **Path:** `/api/books/:id`
- **Description:** Returns the details of a book with the specified ID.
- **Success status:** `200 OK`
- **Request body:** Not required.

Example request:

```http
GET /api/books/12
```

### 3. Create a Book

- **Method:** `POST`
- **Path:** `/api/books`
- **Description:** Creates a new book in the library.
- **Success status:** `201 Created`

Example request body:

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publishedYear": 1958,
  "available": true
}
```

### 4. Update a Book

- **Method:** `PUT`
- **Path:** `/api/books/:id`
- **Description:** Replaces the details of an existing book.
- **Success status:** `200 OK`

Example request:

```http
PUT /api/books/12
```

Example request body:

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publishedYear": 1958,
  "available": false
}
```

### 5. Delete a Book

- **Method:** `DELETE`
- **Path:** `/api/books/:id`
- **Description:** Deletes the book with the specified ID.
- **Success status:** `204 No Content`
- **Request body:** Not required.

Example request:

```http
DELETE /api/books/12
```

### 6. List Books by Author

- **Method:** `GET`
- **Path:** `/api/books?author=Chinua%20Achebe`
- **Description:** Returns books written by the specified author. The `author` query parameter filters the results.
- **Success status:** `200 OK`
- **Request body:** Not required.

Example request:

```http
GET /api/books?author=Chinua%20Achebe
```

## Error Responses

### 400 Bad Request

Returned when the request contains invalid data or parameters.

Example: A client tries to create a book without a title or sends an invalid `publishedYear`.

Example response:

```json
{
  "error": "Bad Request",
  "message": "The title field is required."
}
```

### 404 Not Found

Returned when the requested book does not exist.

Example: A client requests `GET /api/books/9999`, but no book with ID `9999` exists.

Example response:

```json
{
  "error": "Not Found",
  "message": "Book not found."
}
```

## Summary

The API uses standard HTTP methods to manage the books resource:

- `GET` retrieves books.
- `POST` creates a book.
- `PUT` updates a book.
- `DELETE` removes a book.
- Query parameters filter books, such as by author.

The API uses appropriate HTTP status codes to communicate success and errors.
