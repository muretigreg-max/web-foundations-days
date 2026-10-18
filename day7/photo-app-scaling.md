
# SnapShare Photo App Scaling Plan

## 1. Assumptions and Capacity Estimates

### Assumptions

- SnapShare has 10 million registered users.
- 10% of registered users are active daily.
- Each daily active user uploads one photo per day.
- Each daily active user views 50 feed pages per day.
- Each original photo averages 2 MB.
- Each thumbnail averages 50 KB.
- A day has 86,400 seconds, and a year has 365 days.
- Peak feed traffic is five times average traffic.
- Storage calculations use decimal units: 1 MB = 1,000 KB and 1 TB = 1,000,000 MB.
- Every uploaded photo has one stored thumbnail; storage figures exclude backups, replication, and other overhead.

### Daily Active Users

Daily active users (DAU) = 10,000,000 × 10% = **1,000,000 users**.

### Uploads per Second

Daily uploads = 1,000,000 × 1 = **1,000,000 photos**.

Average uploads per second = 1,000,000 ÷ 86,400 = **11.57 uploads/second**.

### Feed Views per Second

Daily feed views = 1,000,000 × 50 = **50,000,000 feed views**.

Average feed views per second = 50,000,000 ÷ 86,400 = **578.7 views/second**.

Peak feed views per second = 578.7 × 5 = **2,893.5 views/second**, or approximately 2,894.

### Photo Storage per Year

Original photo storage per day = 1,000,000 × 2 MB = **2 TB/day**.

Thumbnail storage per day = 1,000,000 × 50 KB = **50 GB/day**, or 0.05 TB/day.

Total new photo storage per day = 2 + 0.05 = **2.05 TB/day**.

Total new photo storage per year = 2.05 × 365 = **748.25 TB/year**, excluding backups, replication, and other overhead.


## 2. System Architecture

```text
                         USERS
                            |
                            v
                     +--------------+
                     |     CDN      |
                     | Cached photos|
                     +--------------+
                            |
                            v
                     +--------------+
                     | Load Balancer|
                     +--------------+
                            |
                            v
                  +--------------------+
                  |   App Servers      |
                  | Uploads and feeds  |
                  +--------------------+
                    |       |       |
                    |       |       +------------------+
                    |       v                          |
                    |  +-----------+                   |
                    |  |   Cache   |                   |
                    |  +-----------+                   |
                    |       |                          |
                    v       v                          v
             +-------------+                 +----------------+
             | Primary DB  |<----------------| Read Replica   |
             | Metadata    |  Replication    | Feed queries   |
             +-------------+                 +----------------+
                    |
                    v
             +----------------+
             | Object Storage |
             | Originals and  |
             | thumbnails     |
             +----------------+
                    ^
                    |
             +----------------+
             | Thumbnail      |
             | Worker         |
             +----------------+
                    ^
                    |
             +----------------+
             | Job Queue      |
             +----------------+
```

### Component Responsibilities

- **CDN:** Delivers cached photos from locations closer to users, reducing latency and origin traffic.
- **Load balancer:** Distributes incoming requests across available application servers.
- **App servers:** Handle uploads, authentication, feed generation, and other application logic.
- **Cache:** Stores frequently accessed feed data and metadata to reduce repeated database queries.
- **Primary database:** Stores authoritative records such as users, photo metadata, and follow relationships.
- **Read replica:** Serves eligible read queries so feed traffic places less load on the primary database.
- **Object storage:** Holds the large original photo files and generated thumbnails independently of the database.
- **Job queue:** Holds thumbnail-generation tasks so uploading a photo does not have to wait for processing to finish.
- **Thumbnail worker:** Processes queued jobs to create smaller thumbnail images and saves them to object storage.


## 3. Step-by-Step Photo Upload Flow

1. **User uploads a photo:** The user selects a photo and submits it through the SnapShare application.
2. **Request reaches the app:** The load balancer routes the request to an available application server.
3. **Validate the upload:** The app server checks authentication, file type, file size, and other upload rules.
4. **Store the original:** The application uploads the original photo to object storage and receives or records its storage key.
5. **Save metadata:** The application records the photo owner, caption, timestamp, and storage key in the primary database.
6. **Queue thumbnail work:** The application places a thumbnail-generation job on the job queue.
7. **Return a response:** The application confirms that the upload has been accepted or completed, depending on the chosen upload workflow.
8. **Generate the thumbnail:** A background worker retrieves the queued job, reads the original photo, creates a 50 KB thumbnail target, and saves it in object storage.
9. **Update photo status:** The worker records that thumbnail processing is complete, or records a failure for retry.
10. **Deliver the photo:** When users view the photo, the CDN serves the original or thumbnail when available in its cache, retrieving it from object storage when necessary.

The queue allows thumbnail processing to happen asynchronously, so the user does not need to wait for that work before receiving an upload response. The application should also handle failed jobs and avoid creating duplicate records when a job is retried.

## 4. Design Trade-offs

### Trade-off 1: Caching versus Freshness

Caching feed data reduces database load and improves response times. However, cached feeds may briefly show outdated information after a user uploads a photo or follows someone. Cache invalidation and expiration rules can reduce this problem, but add complexity.

### Trade-off 2: Read Replicas versus Consistency

A read replica can handle many feed queries and reduce pressure on the primary database. However, replication may lag behind the primary database, meaning a newly uploaded photo may not immediately appear in every feed. Critical reads can use the primary database when fresh data is required.

### Trade-off 3: Object Storage and CDN versus Simplicity

Object storage and a CDN scale well for large photo files and reduce application-server bandwidth. However, they introduce additional services, configuration, costs, and access-control considerations compared with serving all files directly from one server.

### Trade-off 4: Asynchronous Thumbnails versus Immediate Availability

A queue and background worker prevent thumbnail processing from slowing down uploads. However, thumbnails may not be available immediately, and failed jobs require monitoring, retries, and error handling. The application can display a processing placeholder until the thumbnail is ready.
