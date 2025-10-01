## URL Shortener with Analytics

A production-grade URL shortener built with **Hono.js** and **Drizzle ORM**, designed with **system design principles** in mind.
This project goes beyond a toy app — it implements caching, batching, event-driven analytics, and a scalable data lake strategy to handle high-traffic workloads while staying cost-efficient.

---

### 🚀 Features

* **URL Shortening**

  * Unique, collision-resistant short codes via **NanoID**.
  * Global URL deduplication using a `hash` column in `global_urls`.

* **Caching & Performance**

  * Redis cache for fast redirect lookups.
  * Click counters incremented in Redis, then **batched to Postgres** (avoids hot rows).
  * Cached redirects serve in **4–8ms**; uncached in ~80–100ms.

* **Analytics Pipeline**

  * Each click event sent to **Amazon SQS** for durability.
  * **AWS Lambda** consumes messages and stores events in **S3** (append-only JSON).
  * **Amazon Athena** queries historical click data at low cost ($5 per TB scanned).

* **Database Design**

  * **Normalized Postgres schema**:

    * `global_urls`: deduplicated URLs.
    * `user_link`: per-user short codes + analytics references.
  * Clear separation of concerns → supports **multi-user analytics** for the same URL.

* **Batch Processing**

  * Redis `INCR` handles millions of increments per second.
  * Batched flush every ~30s → stable Postgres performance.

---

### 🛠️ Tech Stack

* **Backend Framework**: [Hono.js](https://hono.dev/) (fast, edge-ready)
* **Database ORM**: [Drizzle ORM](https://orm.drizzle.team/)
* **Database**: Postgres
* **Caching**: Redis
* **Queue**: Amazon SQS
* **Event Processing**: AWS Lambda
* **Data Lake**: Amazon S3
* **Analytics Querying**: Amazon Athena
* **ID Generation**: NanoID
* **Deployment Ready**: Containerized / Kubernetes / Serverless

---

### 📂 Architecture Overview


<img width="1127" height="476" alt="Architecture-Diagram" src="https://github.com/user-attachments/assets/f364dc73-320f-488f-84a9-0cd065a15409" />


---

### ⚖️ Trade-offs & Design Choices

* **Redis Counters**

  * ✅ Absorbs high write traffic, prevents DB hotspots.
  * ❌ Possible minor click loss if Redis fails (acceptable, since SQS + S3 preserve long-term data).

* **S3 + Athena Analytics**

  * ✅ Near-infinite, low-cost, serverless analytics.
  * ❌ Eventual consistency (~30s delay before analytics appear).

* **Global URL Deduplication**

  * ✅ Eliminates duplicates, improves cache hit rates, clean per-user separation.
  * ❌ Requires periodic cleanup of unused global URLs.

* **Serverless Event Pipeline**

  * ✅ Durable, decoupled, scalable with zero ops overhead.
  * ❌ Analytics queries aren’t real-time.

---

### 📈 Scalability & Performance

* **Hashing & Deduplication**

  * Each long URL is hashed and indexed in `global_urls`.
  * `user_link` table references hashes with per-user short codes.
  * Enables **multi-user analytics** for the same URL with minimal duplication.

* **Latency Observations (Local Testing)**

  * Cold (uncached): ~80–100ms.
  * Cached: **4–8ms** (mostly 6–8ms).

* **Write Load**

  * Redis `INCR` scales to millions of operations/sec.
  * Batched DB writes (~30s) keep Postgres stable.

* **Durability**

  * Clicks are persisted via **SQS → Lambda → S3**, ensuring **zero data loss**.

* **Cost Efficiency**

  * S3 storage: pennies per GB.
  * Athena queries: $5 per TB scanned.
  * Ideal for long-term analytics without over-provisioning.

* **Future-Ready**

  * Migration path to real-time streams (Kafka/Kinesis) or data warehouses (BigQuery, Snowflake, Redshift).

---

### 📑 Roadmap

* [ ] Real-time streaming analytics (Kafka / Kinesis).
* [ ] CI/CD pipeline with automated migrations.
* [ ] Full-text search on short links.
* [x] Sorting options (`clickCount`, `createdAt`) in API responses.
* [x] Role-based admin dashboard.

---

### 📚 Learning Outcomes

This project demonstrates:

* Using **Redis as a write buffer** for hot keys.
* Decoupling OLTP (Postgres) from OLAP (Athena/S3).
* **Event-driven design** with SQS and Lambda.
* Trade-offs between **real-time vs eventual consistency**.
* Applying **cloud-native scalability patterns** for durability and cost savings.

