
# TicketHub — System Design

## 1. Requirements

### 1.1 Functional Requirements

TicketHub is a website for browsing events and purchasing tickets for concerts and other events.

The system must allow users to:

1. Register, sign in, and manage their accounts.
2. Browse events and search by name, location, date, or category.
3. View event details, ticket prices, and available seats.
4. Temporarily hold available seats while completing checkout.
5. Pay for tickets using a supported payment provider.
6. Receive confirmation and view purchased tickets.
7. Release expired or cancelled seat holds.
8. Prevent users from purchasing the same seat more than once.
9. Provide organizers with event and ticket-sales information.

### 1.2 Non-Functional Requirements

**Speed**
- Event listings and event details should load within approximately two seconds under normal conditions.
- Seat availability should reflect recent reservations and confirmed purchases.
- Checkout requests should receive a prompt response, even when payment processing takes longer.

**Correctness and consistency**
- A seat must not be sold to two different customers.
- A successful order must correspond to a valid payment.
- Failed or expired holds must not permanently block seats.
- The database must enforce critical booking rules rather than relying only on frontend checks.

**Fairness**
- During a high-demand sale, customers should enter a virtual waiting room.
- Admission to the purchasing flow should follow a clearly communicated queue policy, such as first-come, first-served.
- The system should rate-limit automated abuse and prevent users from bypassing the queue.
- Customers should receive clear feedback about their queue position or estimated waiting time when available.

**Availability and reliability**
- The system should continue serving event information if a purchasing component is temporarily unavailable.
- Failed components should be detected through health checks and monitoring.
- Database backups and recovery procedures should protect orders and ticket records.

**Security**
- Require authentication for holding seats, purchasing tickets, and viewing private orders.
- Verify that users can access only their own orders.
- Use HTTPS, secure password hashing, input validation, and rate limiting.
- Never store raw payment-card details in the TicketHub database.

**Scalability**
- The system should support two million registered users and sudden increases in traffic.
- Application servers should scale horizontally.
- Static content and suitable read requests should be served without overloading the primary database.

---

## 2. Traffic and Capacity Estimates

### 2.1 Normal Traffic

Given:
- Registered users: 2,000,000
- Daily visitors: 50,000
- Pages viewed per visitor: 10
- Tickets sold per day: 5,000
- Seconds per day: 86,400

**Daily page views**

50,000 visitors × 10 pages = 500,000 page views per day.

**Average page views per second**

500,000 ÷ 86,400 ≈ 5.79 page views per second.

**Average visitors arriving per second**

50,000 ÷ 86,400 ≈ 0.58 visitors per second.

**Average ticket sales per second**

5,000 ÷ 86,400 ≈ 0.058 ticket sales per second.

This is approximately one ticket sale every 17 seconds on average. Actual traffic will vary by time of day and event popularity.

### 2.2 Popular Concert Sale

Given:
- People trying to buy tickets: 200,000
- Available seats: 20,000
- Sale window: 10 minutes, or 600 seconds

**Average incoming purchase attempts per second**

200,000 ÷ 600 ≈ 333.3 attempts per second.

**Maximum seats available for purchase**

20,000 seats.

**Maximum possible successful seat sales**

20,000, assuming all seats are sold and every purchase is valid.

**Average successful sales rate if all seats sell evenly over ten minutes**

20,000 ÷ 600 ≈ 33.3 sales per second.

**Competition for seats**

200,000 people ÷ 20,000 seats = 10 people per seat on average.

Therefore, 180,000 people cannot obtain one of those 20,000 seats if every person seeks exactly one seat and all seats sell.

These are average rates over the ten-minute period. Actual traffic can arrive in sharp bursts, so the infrastructure must be tested against higher short-duration peaks.

### 2.3 Comparing Normal and Peak Traffic

| Metric | Normal Day | Popular Concert Sale |
|---|---:|---:|
| People visiting or attempting purchase | 50,000 per day | 200,000 in 10 minutes |
| Page views or purchase attempts | 500,000 page views/day | 200,000 purchase attempts |
| Average relevant request rate | 5.79 page views/sec | 333.3 purchase attempts/sec |
| Ticket sales | 5,000/day | At most 20,000 seats |
| Main concern | Efficient everyday service | Fair access and seat consistency |

The peak purchase-attempt rate is approximately 57.6 times the normal average page-view rate. This comparison is useful for illustrating the difference in request intensity, but it is not an exact like-for-like measurement: a purchase attempt requires more processing than a page view.

### 2.4 Capacity Strategy

TicketHub should not send all 200,000 customers directly into checkout at once.

A virtual waiting room should regulate admission to the purchasing flow. The system should use:
- A queue service to manage waiting customers.
- Rate limits to control incoming requests.
- Multiple application servers to process admitted customers.
- Caching for event descriptions and other suitable read-only information.
- Database transactions and constraints to protect seat availability.
- Monitoring to detect rising latency, queue length, and database load.

The admission rate should be adjusted using load-test results and the measured capacity of the booking and payment services. A queue smooths demand but does not eliminate the need for sufficient backend capacity.

---

## 3. API Design

Base URL: `/api/v1`

The API uses HTTP methods and JSON responses. All endpoints that involve personal orders or purchasing require authentication.

| Method | Endpoint | Purpose | Success Status |
|---|---|---|---|
| GET | `/events` | Browse and search events | 200 OK |
| GET | `/events/{eventId}` | View event details | 200 OK |
| GET | `/events/{eventId}/seats` | View seat availability | 200 OK |
| POST | `/events/{eventId}/holds` | Hold one or more seats temporarily | 201 Created |
| POST | `/orders/{orderId}/pay` | Initiate payment for an order | 202 Accepted |
| GET | `/me/tickets` | View the authenticated user's tickets | 200 OK |
| GET | `/orders/{orderId}` | View an order owned by the user | 200 OK |
| DELETE | `/holds/{holdId}` | Release a user's active hold | 204 No Content |

### 3.1 Browse Events

Request:

`GET /api/v1/events?date=2026-12-15&location=Nairobi&page=1`

Example response:

```json
{
  "data": [
    {
      "id": 101,
      "name": "Summer Music Festival",
      "location": "Nairobi",
      "date": "2026-12-15T17:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

### 3.2 View Seats

Request:

`GET /api/v1/events/101/seats`

Example response:

```json
{
  "eventId": 101,
  "seats": [
    {
      "id": 501,
      "label": "A-01",
      "status": "AVAILABLE",
      "price": 2500
    },
    {
      "id": 502,
      "label": "A-02",
      "status": "HELD",
      "price": 2500
    }
  ],
  "currency": "KES"
}
```

Seat availability may change immediately after this response. The server must recheck availability when a hold is requested.

### 3.3 Hold Seats

Request:

`POST /api/v1/events/101/holds`

```json
{
  "seatIds": [501, 502],
  "idempotencyKey": "checkout-unique-key-123"
}
```

Example response:

```json
{
  "holdId": "hold-789",
  "status": "ACTIVE",
  "expiresAt": "2026-12-15T16:05:00Z",
  "message": "Seats held temporarily."
}
```

The server creates a hold only if every requested seat can be reserved. Otherwise, it returns `409 Conflict` and does not create a partial hold.

A hold lasts for a limited period, such as five minutes. The expiry policy must be communicated to the customer.

### 3.4 Pay for an Order

Request:

`POST /api/v1/orders/order-789/pay`

```json
{
  "paymentMethod": "supported-provider",
  "idempotencyKey": "payment-unique-key-456"
}
```

Example response:

```json
{
  "orderId": "order-789",
  "paymentStatus": "PENDING",
  "message": "Payment is being processed."
}
```

The server verifies the order and active hold before starting payment. It verifies payment outcomes with the payment provider and handles provider callbacks securely. The client must not be trusted to declare a payment successful.

### 3.5 View Tickets

Request:

`GET /api/v1/me/tickets`

Example response:

```json
{
  "data": [
    {
      "ticketId": "ticket-321",
      "eventId": 101,
      "eventName": "Summer Music Festival",
      "seatLabel": "A-01",
      "status": "CONFIRMED"
    }
  ]
}
```

### 3.6 API Errors

| Status | Meaning |
|---|---|
| 400 | Invalid request |
| 401 | Authentication required |
| 403 | User lacks permission |
| 404 | Event, seat, hold, or order not found |
| 409 | Seat unavailable, expired hold, or conflicting booking |
| 429 | Too many requests or queue admission limit reached |
| 500 | Unexpected server error |
| 503 | Booking service temporarily unavailable |

Example error response:

```json
{
  "error": {
    "code": "SEAT_UNAVAILABLE",
    "message": "One or more selected seats are no longer available."
  }
}
```

---

## 4. Data Model

TicketHub uses a relational database because orders, users, events, and seats have relationships that require strong consistency.

### 4.1 Users

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary key |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

### 4.2 Events

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary key |
| name | VARCHAR(200) | NOT NULL |
| description | TEXT | Nullable |
| venue | VARCHAR(200) | NOT NULL |
| event_date | TIMESTAMP | NOT NULL |
| sale_starts_at | TIMESTAMP | NOT NULL |
| status | VARCHAR(30) | NOT NULL |

### 4.3 Seats

Each seat belongs to one event.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary key |
| event_id | BIGINT | Foreign key to Events |
| seat_label | VARCHAR(30) | NOT NULL |
| price | DECIMAL(10,2) | NOT NULL |
| status | VARCHAR(20) | NOT NULL |
| hold_order_id | BIGINT | Nullable foreign key to Orders |
| hold_expires_at | TIMESTAMP | Nullable |

Constraints:
- `UNIQUE(event_id, seat_label)` prevents duplicate seat labels within an event.
- `status` is restricted to valid states such as `AVAILABLE`, `HELD`, and `SOLD`.
- A held seat must have an associated active hold and expiry time.

### 4.4 Orders

An order records a customer's attempt to purchase seats.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary key |
| user_id | BIGINT | Foreign key to Users |
| status | VARCHAR(30) | NOT NULL |
| total_amount | DECIMAL(10,2) | NOT NULL |
| idempotency_key | VARCHAR(100) | UNIQUE |
| created_at | TIMESTAMP | NOT NULL |
| expires_at | TIMESTAMP | Nullable |

Possible statuses include `PENDING`, `PAYMENT_PENDING`, `CONFIRMED`, `CANCELLED`, and `EXPIRED`.

### 4.5 Tickets

A ticket represents a successfully purchased seat.

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary key |
| order_id | BIGINT | Foreign key to Orders |
| seat_id | BIGINT | Foreign key to Seats, UNIQUE |
| ticket_code | VARCHAR(100) | NOT NULL, UNIQUE |
| status | VARCHAR(20) | NOT NULL |
| issued_at | TIMESTAMP | NOT NULL |

The unique constraint on `seat_id` ensures that the same seat cannot be assigned to two ticket records.

### 4.6 Payments

| Column | Type | Constraints |
|---|---|---|
| id | BIGINT | Primary key |
| order_id | BIGINT | Foreign key to Orders |
| provider_reference | VARCHAR(150) | UNIQUE |
| amount | DECIMAL(10,2) | NOT NULL |
| status | VARCHAR(30) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

Payment attempts should be recorded so pending, failed, and successful payments can be reconciled.

### 4.7 Relationships

- **Users to Orders:** One-to-many. A user may place multiple orders.
- **Events to Seats:** One-to-many. Each event has multiple seats.
- **Orders to Tickets:** One-to-many. An order may contain multiple tickets.
- **Seats to Tickets:** One-to-one for sold seats. A seat may have no ticket before purchase, but only one ticket after sale.
- **Orders to Payments:** One-to-many. An order may have multiple payment attempts.

The `Seats.hold_order_id` field refers to an order. In an implementation, the database migration must create the tables in an order that handles the circular relationship between Seats and Orders, or use a separate SeatHolds table.

---

## 5. Preventing Double-Booking

The most important correctness requirement is that two customers must never successfully purchase the same seat.

Checking seat availability only in the browser is insufficient. Two customers can both see an available seat before either submits a booking request.

TicketHub prevents this using database transactions, row locking, conditional updates, and uniqueness constraints.

### 5.1 Atomic Seat Holding

When a customer requests seats:

1. Authenticate the customer and validate the requested event and seats.
2. Begin a database transaction.
3. Lock the requested seat rows in a consistent order to reduce deadlocks.
4. Check that every seat is available or has an expired hold.
5. Change all requested seats to `HELD` and assign the hold expiry time.
6. Create the associated order or hold record.
7. Commit the transaction.

If any requested seat is unavailable, the transaction rolls back. No partial set of seats is held.

For PostgreSQL, the implementation can use `SELECT ... FOR UPDATE` to lock rows. An alternative is a conditional update that succeeds only when the seat is available or its hold has expired.

Conceptually:

```sql
BEGIN;

SELECT id, status, hold_expires_at
FROM seats
WHERE event_id = :event_id
  AND id IN (:seat_ids)
ORDER BY id
FOR UPDATE;

-- Application verifies every requested seat is available.
-- It then updates the seats and creates the hold/order.

COMMIT;
```

This is a simplified illustration. The production implementation must verify that every requested seat was found and successfully reserved before committing.

### 5.2 Hold Expiry

A seat hold is temporary. If checkout is not completed within the permitted time, the hold expires and the seat becomes available again.

Expiry must be enforced by the booking service and database operations, not only by a browser timer. A background worker may clean up expired holds, but a new booking request must also check expiry so it does not depend on the worker running immediately.

### 5.3 Confirming a Purchase

After payment is verified:

1. Start a transaction.
2. Lock the order and its held seats.
3. Verify that the order is eligible for confirmation and the seats still belong to its active hold.
4. Record the verified payment outcome.
5. Create ticket records and change the seats to `SOLD`.
6. Mark the order `CONFIRMED`.
7. Commit the transaction.

The `UNIQUE` constraint on `Tickets.seat_id` acts as a final database-level safeguard against duplicate tickets.

Payment processing involves an external provider and cannot usually be part of the same database transaction. TicketHub therefore uses idempotency keys, verified provider callbacks, and reconciliation for uncertain outcomes. If payment succeeds after a hold expires, the system must follow a defined recovery policy, such as attempting a safe reallocation or issuing a refund. It must never silently sell an already assigned seat twice.

---

## 6. Architecture

### 6.1 Architecture Diagram

```text
                         CUSTOMERS
                             |
                             v
                      DNS / HTTPS
                             |
                             v
                     CDN / STATIC ASSETS
                             |
                             v
                  VIRTUAL WAITING ROOM
                             |
                             v
                       LOAD BALANCER
                             |
                 +-----------+-----------+
                 |                       |
                 v                       v
          APPLICATION A           APPLICATION B
                 |                       |
                 +-----------+-----------+
                             |
                 +-----------+-----------+
                 |                       |
                 v                       v
             READ CACHE            BOOKING SERVICE
                                         |
                                         v
                                PRIMARY SQL DATABASE
                                         |
                                         v
                                  READ REPLICA

          BOOKING / ORDER EVENTS
                    |
                    v
              MESSAGE QUEUE
                    |
                    v
           BACKGROUND WORKERS
                    |
                    v
           EMAIL / TICKET DELIVERY

          APPLICATION / BOOKING SERVICE
                    |
                    v
              PAYMENT PROVIDER
```

### 6.2 Component Explanation

**CDN:** Delivers static assets and reduces repeated requests to the application servers. Public event content can be cached with suitable expiry rules.

**Virtual waiting room:** Manages the large arrival burst. It admits customers according to the published queue policy and the booking service's capacity. Signed queue tokens and server-side validation help prevent queue bypass.

**Load balancer:** Distributes admitted traffic among healthy application instances and removes unhealthy instances from rotation.

**Application servers:** Handle authentication, event browsing, validation, and API requests. Multiple stateless instances can be added as demand increases.

**Booking service:** Coordinates seat holds, orders, and booking state transitions. It relies on database transactions and constraints to guarantee seat correctness.

**Read cache:** Reduces database load for frequently requested event details and other suitable data. Cache entries must not be treated as authoritative seat availability.

**Primary SQL database:** Stores authoritative users, events, seats, orders, payments, and tickets. Seat allocation and order confirmation use transactions.

**Read replica:** Serves suitable read-only queries and reduces pressure on the primary database. It may lag behind the primary, so booking decisions must not rely on stale replica data.

**Message queue:** Holds asynchronous tasks such as ticket delivery and notifications. Durable messages and retry handling help recover from temporary worker failures.

**Background workers:** Process queued jobs independently of customer-facing requests. Ticket delivery should be idempotent to avoid sending duplicate notifications unnecessarily.

**Payment provider:** Processes payments externally. TicketHub verifies payment results and uses idempotency and reconciliation to handle retries and uncertain responses.

### 6.3 Surviving the Big Sale

During the popular concert sale, the system expects an average of about 333 purchase attempts per second over ten minutes, with possible much higher short bursts.

TicketHub handles this through the following measures:

1. The waiting room smooths the arrival rate and applies a fair admission policy.
2. The CDN serves static content without sending every asset request to the application servers.
3. Horizontal application scaling increases request-processing capacity.
4. Caching reduces repeated reads of event descriptions and other suitable information.
5. Database connection pooling and indexes reduce avoidable database overhead.
6. The booking service limits concurrent booking work to the database's tested capacity.
7. Transactions, row locks, and uniqueness constraints protect the correctness of seat sales even when many customers request the same seat.
8. Monitoring tracks queue depth, latency, database connections, lock waits, failed requests, and payment outcomes.
9. Background workers deliver tickets and notifications without blocking the booking response.
10. Database backups, failover planning, and recovery testing help protect the service from component failures.

The architecture should be load-tested with realistic bursts before a major sale. The exact number of application instances and the waiting-room admission rate should be determined from those tests rather than guessed in advance.

---

## 7. Trade-Offs

### 7.1 Strict Consistency vs. Higher Throughput

**Choice:** Use transactions and row-level locking for seat reservations and purchase confirmation.

**Benefit:** Prevents conflicting bookings and protects the correctness of ticket sales.

**Cost:** Contending requests may wait for locks, reducing throughput for heavily requested seats.

**Decision:** Correctness is more important than maximizing raw request throughput. The waiting room controls admission, while row-level locking limits contention to the relevant seats.

### 7.2 Fair Queueing vs. Faster Access

**Choice:** Use a virtual waiting room with a published admission policy.

**Benefit:** Controls sudden traffic spikes and gives customers a more predictable, transparent purchasing process.

**Cost:** Customers wait longer, and queue infrastructure introduces complexity.

**Decision:** Fair access and system stability are more important than allowing every visitor to enter checkout immediately. Queue rules should be communicated clearly and enforced consistently.

### 7.3 Caching vs. Fresh Availability

**Choice:** Cache event descriptions and suitable browsing data, but use the primary database for booking decisions.

**Benefit:** Reduces database load and improves browsing performance.

**Cost:** Cached data can become stale and may briefly show a seat as available when it is already held or sold.

**Decision:** Stale data may be acceptable for browsing, but the booking transaction must always verify authoritative availability.

### 7.4 Simplicity vs. High Availability

**Choice:** Start with a manageable architecture and add redundant services, replicas, queues, and automated failover as requirements justify them.

**Benefit:** Avoids unnecessary cost and operational complexity early on.

**Cost:** A simpler deployment has fewer resilience options and may not withstand major traffic spikes or individual component failures.

**Decision:** Load-test the initial design and introduce redundancy where measured risk and service requirements justify it.

---

## 8. Conclusion

TicketHub must balance speed, fairness, scalability, and correctness. The virtual waiting room controls the surge of customers, horizontally scaled services process admitted requests, and a relational database protects the integrity of seat allocation.

The central design decision is that a seat is not considered sold merely because it appeared available in the browser. A successful purchase requires a valid hold, verified payment, an atomic database transaction, and a unique ticket assignment.

The proposed design can support the stated demand only after its components are capacity-tested and appropriately configured.
