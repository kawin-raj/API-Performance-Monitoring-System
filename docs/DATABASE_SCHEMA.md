# Database Schema Documentation

## Database Technology: SQLite

---

### Entity Relationship Diagram (Textual Representation)

```
+--------------------+            +-----------------------+
|       USERS        |            |       API_LOGS        |
+--------------------+            +-----------------------+
| id (PK)            |            | id (PK)               |
| name               |            | timestamp             |
| email              | 1        * | endpoint              |
| role               |------------| method                |
| created_at         |            | status_code           |
+--------------------+            | response_time_ms      |
                                  | payload_size_kb       |
                                  | concurrency_level     |
                                  | cpu_usage_pct         |
                                  | mem_usage_pct         |
                                  | is_anomaly            |
                                  | anomaly_score         |
                                  | anomaly_reason        |
                                  +-----------------------+
                                              |
                                              | 1
                                              |
                                              | *
                                  +-----------------------+
                                  |        ALERTS         |
                                  +-----------------------+
                                  | id (PK)               |
                                  | timestamp             |
                                  | endpoint              |
                                  | alert_type            |
                                  | message               |
                                  | severity              |
                                  | status                |
                                  | metric_value          |
                                  | threshold_value       |
                                  +-----------------------+
```

---

### Table Specifications

#### 1. `users`
| Field | Type | Constraint | Description |
|---|---|---|---|
| `id` | VARCHAR(64) | PRIMARY KEY | Unique user identifier |
| `name` | VARCHAR(128) | NOT NULL | User full name |
| `email` | VARCHAR(128) | UNIQUE, NOT NULL | User login email |
| `role` | VARCHAR(32) | NOT NULL | Role: Admin / ML Engineer / Viewer |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Account creation date |

#### 2. `api_logs`
| Field | Type | Constraint | Description |
|---|---|---|---|
| `id` | VARCHAR(64) | PRIMARY KEY | Unique log record ID |
| `timestamp` | DATETIME | NOT NULL | Telemetry timestamp |
| `endpoint` | VARCHAR(255) | NOT NULL | API endpoint path |
| `method` | VARCHAR(10) | NOT NULL | GET / POST / PUT / DELETE |
| `status_code` | INT | NOT NULL | HTTP status code (200, 429, 500) |
| `response_time_ms` | FLOAT | NOT NULL | API response latency in ms |
| `payload_size_kb` | FLOAT | NOT NULL | Request/response payload size in KB |
| `concurrency_level` | INT | NOT NULL | Concurrent active connections |
| `cpu_usage_pct` | FLOAT | NOT NULL | Server CPU usage percentage |
| `mem_usage_pct` | FLOAT | NOT NULL | Server RAM usage percentage |
| `is_anomaly` | BOOLEAN | DEFAULT FALSE | Flagged by Isolation Forest |
| `anomaly_score` | FLOAT | DEFAULT 0.0 | Isolation Forest score (0 to 1) |
| `anomaly_reason` | TEXT | NULLABLE | Reason string if anomaly |

#### 3. `alerts`
| Field | Type | Constraint | Description |
|---|---|---|---|
| `id` | VARCHAR(64) | PRIMARY KEY | Unique alert ID |
| `timestamp` | DATETIME | NOT NULL | Alert creation time |
| `endpoint` | VARCHAR(255) | NOT NULL | Affected API endpoint |
| `alert_type` | VARCHAR(64) | NOT NULL | High Latency / Outage / Anomaly |
| `severity` | VARCHAR(16) | NOT NULL | Critical / High / Medium / Low |
| `status` | VARCHAR(16) | NOT NULL | Active / Acknowledged / Resolved |
| `message` | TEXT | NOT NULL | Detailed alert message |

#### 4. `reports`
| Field | Type | Constraint | Description |
|---|---|---|---|
| `id` | VARCHAR(64) | PRIMARY KEY | Unique report ID |
| `type` | VARCHAR(16) | NOT NULL | Daily / Weekly / Monthly |
| `period` | VARCHAR(64) | NOT NULL | Timeframe description |
| `generated_at` | DATETIME | NOT NULL | Report timestamp |
| `summary_json` | TEXT | NOT NULL | JSON string of KPI metrics |
| `recommendations_json` | TEXT | NOT NULL | ML generated recommendations |
