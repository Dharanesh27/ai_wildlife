# Wildlife Population Intelligence System
## User Setup & Operations Manual

Welcome to the **Wildlife Population Intelligence System**. This manual provides complete instructions for developers and evaluators to install, configure, start, and test the platform.

---

## 📋 1. System Prerequisites

Ensure the following tools are installed on your machine:
*   **Python (v3.10 or newer)**
*   **Node.js (v18 or newer)**
*   **PostgreSQL** (running on port `5432` with username/password: `postgres`/`postgres`)
*   **Redis** (Optional background queue broker, falls back to synchronous execution if offline)

---

## 🛠️ 2. Step-by-Step Installation

### Step A: Extract Code
Unzip the project package into your preferred working directory (e.g. `C:\Ai_Wildlife`).

### Step B: Configure Backend Dependencies
Open your terminal in the `backend/` directory:
```bash
cd backend

# 1. Create Python virtual environment
python -m venv venv

# 2. Activate virtual environment
# On Windows (Command Prompt/PowerShell):
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# 3. Install Python requirements
pip install -r requirements.txt
```

### Step C: Configure Database Connections
Verify your local PostgreSQL server is active. The system connects using parameters in `backend/app/core/config.py` or a local `.env` file.
*   **Default Connection String**: `postgresql+asyncpg://postgres:postgres@localhost:5432/postgres`
*   If your PostgreSQL username or password differs, create a file named `.env` in the `backend/` directory and add:
    ```env
    DATABASE_URL=postgresql+asyncpg://your_username:your_password@localhost:5432/your_database
    ```

### Step D: Configure Frontend Dependencies
Open a separate terminal in the `frontend/` directory:
```bash
cd frontend

# Install Node modules
npm install
```

---

## 🚀 3. Running the Application

### 💻 Windows Startup (One-Click)
Go to the project root directory and double-click:
👉 **`start.bat`**

This script automatically spins up:
1.  **FastAPI Backend Server** on `http://localhost:8000`
2.  **Celery Background Queue Worker**
3.  **Next.js Web Interface** on `http://localhost:3000`

*Note: If you do not have Redis running locally, close the Celery terminal window. The backend automatically switches to failsafe synchronous execution mode and will process all inferences successfully.*

---

## 👥 4. Test Accounts & Role Authorization

Once the servers are running, navigate your web browser to:
👉 **`http://localhost:3000`**

Log in using the pre-seeded accounts to experience the custom role-based dashboards:

| Account Role | Login Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@wildlife.gov` | `password123` | Full system access, AI uploads, GIS Maps, seed databases, approvals. |
| **Conservation Officer** | `officer@wildlife.gov` | `password123` | View GIS Maps, handle telemetry alerts, resolve recommendations. |
| **Wildlife Researcher** | `researcher@wildlife.gov` | `password123` | View-only statistics, census graphs, download PDF & Excel reports. |

---

## 🔒 5. User Management & Registrations

1.  **Direct Registration Flow**: New users registering via the public `/register` page are instantly created as **Active (`is_active = True`)**.
2.  **Instant Login**: Right after completing signup, users can immediately log in with their credentials to access the console based on their chosen privilege level.
3.  **Role Access Controls**: The interface dynamically hides or shows components depending on the authenticated role (e.g. Researchers only see overview census metrics, while Officers see GIS Map Layers).
