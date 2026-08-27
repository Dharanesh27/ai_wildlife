# Step-by-Step Execution Guide

This document describes how to execute and run the **Wildlife Population Intelligence System** on your local machine.

---

## 🛠️ Step 1: Initialize Your Database Server

### How to Start the PostgreSQL Service
Depending on your operating system, start the database service using the following methods:

#### 💻 Windows
*   **Method A (via Services Manager - Recommended)**:
    1.  Press `Win + R`, type `services.msc`, and press **Enter**.
    2.  Scroll down to locate **`postgresql-x64-XX`** (where `XX` is your installed version, e.g. `postgresql-x64-15`).
    3.  Right-click the service name and select **Start** (or **Restart**).
*   **Method B (via Command Prompt as Administrator)**:
    ```cmd
    net start postgresql-x64-15
    ```
    *(Adjust the number `15` to match your installed version).*

#### 🍏 macOS (Homebrew)
If installed via Homebrew, run:
```bash
brew services start postgresql
```

#### 🐧 Linux (Ubuntu / Debian / CentOS)
Run the system control command:
```bash
sudo systemctl start postgresql
```

---

### Verify and Seed Database
1.  Open your database client (like pgAdmin or psql) and verify you can connect using your default credentials:
    *   **Host**: `localhost`
    *   **Port**: `5432`
    *   **User**: `postgres`
    *   **Password**: `postgres`
2.  Ensure a database named **`ai_wildlife`** is created on your server. (If you want to re-create it clean, you can run the helper script: `venv\Scripts\python.exe backend/scripts/create_db.py`).

---

## 🐍 Step 2: Set Up and Start the Backend Service
Open a terminal in the `backend/` directory:

```bash
cd backend

# 1. Create Python virtual environment
python -m venv venv

# 2. Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# 3. Install required Python packages
pip install -r requirements.txt

# 4. Launch the FastAPI Uvicorn Server
uvicorn app.main:app --reload --port 8000
```
*The backend is successfully active when you see: `INFO: Uvicorn server running on http://127.0.0.1:8000`*

---

## ⚡ Step 3: Set Up and Start the Frontend Service
Open a separate terminal window in the `frontend/` directory:

```bash
cd frontend

# 1. Install Node.js packages
npm install

# 2. Launch the Next.js Dev Server
npm run dev
```
*The frontend is successfully active when you see: `Ready in ...` and can access `http://localhost:3000`*

---

## 🚦 Step 4: Asynchronous Task Queue (Optional)
If you have **Redis** running locally:
Open a third terminal window in the `backend/` directory and start Celery:

```bash
cd backend

# On Windows:
venv\Scripts\activate
celery -A app.core.celery_app.celery_app worker --loglevel=info -P threads

# On macOS/Linux:
source venv/bin/activate
celery -A app.core.celery_app.celery_app worker --loglevel=info
```
*Note: If Redis is not installed, you can skip this step. All uploads will execute synchronously on the backend thread automatically.*

---

## 💻 Step 5: Automating Launch (Windows Only)
If you are on Windows, you can skip Steps 2, 3, and 4. Go to the project root directory and double-click:
👉 **`start.bat`**

This script automatically opens 3 terminals and runs the backend, frontend, and Celery tasks concurrently.
