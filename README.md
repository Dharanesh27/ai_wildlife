# AI Wildlife Population Intelligence System
### 🌲 Enterprise spatial & bioacoustic analysis for global wildlife preservation.

Welcome to the **Wildlife Population Intelligence System**. This platform serves as a modern web console designed to ingest multi-modal telemetry feeds (camera trap photos, acoustic audio tracks), process them through local AI classifiers, resolve taxonomic information via international registries, and deploy security patrol recommendations.

---

## 📂 Project Document Indexes

To make setup and hand-off easy, we have generated separate, specialized documentation files in the root folder. Please refer to them:

1.  **🚀 [Execution Steps (EXECUTION_STEPS.md)](file:///c:/Users/dhara/Ai_Wildlife/EXECUTION_STEPS.md)**: Copy-pasteable terminal commands to set up the databases, backend services, frontend dashboard, and workers.
2.  **🛠️ [Software Required (SOFTWARE_NEEDED.md)](file:///c:/Users/dhara/Ai_Wildlife/SOFTWARE_NEEDED.md)**: Downloader links and versions for Python, Node.js, PostgreSQL, Redis, and MongoDB.
3.  **⚙️ [System Workflow (WORKFLOW.md)](file:///c:/Users/dhara/Ai_Wildlife/WORKFLOW.md)**: Detailed technical architectural blueprint showing telemetry ingestion, ML processing, taxonomy queries, and drone dispatch calculations.
4.  **📕 [Full User Manual (MANUAL.md)](file:///c:/Users/dhara/Ai_Wildlife/MANUAL.md)**: A complete operator's manual covering login privileges, testing pipelines, and user permission management workflows.

---

## 🌟 Primary Technology Stack

### 🐍 Backend Service (FastAPI)
*   **FastAPI**: Asynchronous REST endpoints, Swagger/OpenAPI automatic schemas.
*   **SQLAlchemy & Asyncpg**: Async connection pooling to PostgreSQL.
*   **ONNX Inference Engine**: OpenCV DNN modules running custom YOLOv8 model layers offline.
*   **Celery & Redis**: Task broker queuing for heavy file analysis tasks.
*   **ReportLab & OpenPyXL**: Compilation utilities to output print-ready PDFs and Excel spreadsheets.

### ⚛️ Frontend Console (Next.js)
*   **Next.js 15 (App Router)**: Client and server-side components.
*   **Redux Toolkit**: auth session persistence.
*   **Leaflet GIS Map**: Spatial tiles layers selector mapping nodes (Light, Dark, Satellite, Terrain).
*   **Tailwind CSS**: Glassmorphic interfaces and responsive controls.

---

## 📂 Directory Blueprint

*   `backend/app/api`: FastAPI routers (Auth, Survey, Alerts, Analytics, Reports).
*   `backend/app/core`: Core services (YOLOv8 vision models, bioacoustic decibel analysis, GBIF taxonomy service).
*   `backend/app/domain`: Database schemas and models.
*   `backend/app/repositories`: Async database query layers.
*   `frontend/src/app`: Page components (Login, Register, Dashboard console).
*   `frontend/src/components`: Reusable GUI elements (GIS Map, analytical charts).
*   `start.bat`: One-click startup script for Windows.
