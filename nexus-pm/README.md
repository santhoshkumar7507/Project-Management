# ⚡ Nexus PM
### The Event-Driven Project Management Core

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python-Version](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![React-Version](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Docker-Safe](https://img.shields.io/badge/Docker-Ready-green.svg)](https://www.docker.com/)

**Nexus PM** is a high-concurrency, microservices-based project orchestration platform. It leverages advanced event-driven architecture (EDA) to provide real-time updates across distributed systems, making it suitable for enterprise-level team coordination.

---

## 🏗 High-Level Architecture

Nexus PM is built on a "Decoupled Service Pattern" where no microservice communicates directly with another. All state changes are broadcast via **Apache Kafka**, allowing for extreme scalability and easier maintenance.

### Key Components:
- **🔐 Auth Engine (Django 5)**: Secure identity management using JWT and OAuth2 integration.
- **⚡ Task Plane (FastAPI)**: High-performance async service for projects, sprints, and task lifecycles.
- **📣 Notification Hub (Flask + Celery)**: Asynchronous email and alert delivery system.
- **🌌 Live Sync (Socket.io)**: Real-time mission control updates via localized WebSocket rooms.
- **🚥 API Gateway (Nginx)**: Centralized entry point with rate-limiting and JWT routing.

---

## 🚀 Quick Start

Initialize the entire distributed system in your local environment with a single command:

```bash
# Clone the repository
git clone https://github.com/santhoshkumar7507/Project-Management.git

# Enter the directory
cd nexus-pm

# Spin up all 12+ containers (Kafka, Redis, MySQL, Services, UI)
docker compose up --build
```

---

## 📊 System Dashboard

Once the containers are operational, you can access the various control planes:

| Interface | Access URL | Description |
| :--- | :--- | :--- |
| **Main Web App** | [http://localhost](http://localhost) | Production Kanban UI |
| **Kafka UI** | [http://localhost:8080](http://localhost:8080) | Real-time event monitoring |
| **Mailhog** | [http://localhost:8025](http://localhost:8025) | Local email testing dashboard |

---

## 🔌 API Ecosystem

The system exposes a comprehensive RESTful API divided by business logic domains.

### 1. Identity & Access
*   `POST /api/auth/register/` - Operator registration
*   `POST /api/auth/login/` - Token generation (JWT)
*   `GET /api/auth/me/` - Identity verification

### 2. Orchestration (Tasks & Sprints)
*   `GET /api/projects/` - Retrieve active projects
*   `POST /api/tasks/` - Deploy a new task
*   `PATCH /api/tasks/{id}/assign` - Reassign task operator

### 3. Event Streams
*   `task.created` -> Broadcasters -> All UI nodes on relevant project
*   `task.updated` -> Notification Engine -> Async Email Delivery

---

## 🛠 Engineering Decisions

### Why use Apache Kafka?
Direct HTTP calls between services (Request-Response) create tight coupling and cascading failures. By using Kafka as an event bus, the system achieves **Temporal Decoupling**. If the Notification service is down, events are queued and processed once it returns, with zero data loss.

### Per-Service Database Isolation
Each microservice owns its data schema (MySQL/Redis). This ensures that a change in the Task schema never breaks the Auth service, enabling independent CI/CD pipelines for different teams.

### Async I/O (FastAPI + SQLAlchemy 2.0)
The Task Plane uses fully asynchronous database sessions and I/O operations, allowing it to handle thousands of concurrent status updates with minimal resource footprint.

---

## 📁 Repository Structure

```text
nexus-pm/
├── frontend/             # React + Vite + Zustand (UI Layer)
├── services/             # Distributed Logic
│   ├── auth-service/     # Identity Management (Django)
│   ├── task-service/     # Core Business Logic (FastAPI)
│   ├── notification-hub/ # Alert Processing (Flask/Celery)
│   └── ws-sync/          # Live Stream (Socket.io)
├── nginx/                # API Gateway & Reverse Proxy
└── docker-compose.yml    # System Orchestration
```

---

## 🛑 Decommissioning

To gracefully shut down all services and purge volumes:

```bash
docker compose down -v
```

---
**Maintained by [Santhosh Kumar](https://github.com/santhoshkumar7507)**
