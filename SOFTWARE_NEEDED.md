# System Software Requirements

This file lists the required software applications and development runtimes needed to execute the **Wildlife Population Intelligence System**.

---

## 🛠️ Required Runtimes

### 1. Python (v3.10 or v3.11)
*   **Purpose**: Runs the FastAPI backend server, YOLOv8/YAMNet inference pipelines, database seeding scripts, and Celery tasks.
*   **Minimum Version**: `3.10.x`
*   **Download Link**: [python.org/downloads](https://www.python.org/downloads/)
*   *Note for Windows users: Ensure you check the box that says "Add Python.exe to PATH" during installation.*

### 2. Node.js (v18.x or v20.x LTS)
*   **Purpose**: Runs the Next.js React frontend dashboard web server.
*   **Minimum Version**: `18.x` (LTS version recommended)
*   **Download Link**: [nodejs.org](https://nodejs.org/)

---

## 🗄️ Database & Broker Services

### 3. PostgreSQL Database (v14 or newer)
*   **Purpose**: Stores structured persistent relational entities (Users, Sites, Devices, Observations, Health Logs, and Recommendations).
*   **Minimum Version**: `14.x`
*   **Connection Port**: `5432`
*   **Default Setup Parameters**:
    *   Host: `localhost`
    *   Username: `postgres`
    *   Password: `postgres` (or as configured in your backend `.env` file)
*   **Download Link**: [postgresql.org/download](https://www.postgresql.org/download/)

### 4. Redis Server (Optional / Highly Recommended)
*   **Purpose**: Acts as the message broker queue for asynchronous Celery background task processing.
*   **Default Setup Port**: `6379`
*   *Failsafe: If Redis is offline, the backend automatically bypasses the queue and processes all incoming telemetry files synchronously.*
*   **Download Link (Windows Port)**: [github.com/microsoftarchive/redis/releases](https://github.com/microsoftarchive/redis/releases) (or via Docker: `docker run -d -p 6379:6379 redis:alpine`)

### 5. MongoDB (Optional)
*   **Purpose**: Serves as the document repository storing secondary audit warning telemetry logs.
*   **Default Setup Port**: `27017`
*   *Failsafe: If MongoDB is offline, the backend automatically redirects warning alarms to local memory lists.*
*   **Download Link**: [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) (or via Docker: `docker run -d -p 27017:27017 mongo:latest`)
