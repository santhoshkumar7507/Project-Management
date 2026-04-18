# ⚡ Nexus PM — Event-Driven Project Management Platform

A production-grade, MNC-level microservices project management tool built with:

- **Django** — Auth & User management (JWT + OAuth2)
- **FastAPI** — Async Task/Project/Sprint service
- **Flask + Celery** — Notification service with email queuing
- **Python socket.io** — Real-time WebSocket server
- **Apache Kafka** — Event bus (decoupled microservices)
- **MySQL** — Per-service isolated databases
- **Redis** — Sessions, WS rooms, Celery broker
- **React + Zustand** — Kanban board with live updates
- **Nginx** — API Gateway with rate limiting
- **Docker Compose** — One-command full stack

---

## 🚀 Run in ONE command

```bash
git clone <your-repo>
cd nexus-pm
docker compose up --build
```

That's it. Everything starts automatically.

---

## 🌐 Access

| Service              | URL                          |
|---------------------|-------------------------------|
| **App (Frontend)**  | http://localhost              |
| **Mailhog (Emails)**| http://localhost:8025         |
| **Kafka UI**        | http://localhost:8080         |

---

## 📋 Architecture

```
Browser
  └── Nginx (port 80) ← API Gateway + rate limit + JWT routing
        ├── /api/auth/         → Django Auth Service      (:8001)
        ├── /api/tasks/        → FastAPI Task Service      (:8002)
        ├── /api/projects/     → FastAPI Task Service      (:8002)
        ├── /api/sprints/      → FastAPI Task Service      (:8002)
        ├── /api/notifications/→ Flask Notify Service      (:8003)
        └── /ws/               → socket.io WS Server       (:8004)

Event Bus: Apache Kafka
  task.created  ──► WebSocket Service (broadcast to project room)
  task.updated  ──► WebSocket Service + Notification Service
  task.assigned ──► WebSocket Service + Notification Service
                                        └── Celery → Email (Mailhog)
```

---

## 🔑 API Reference

### Auth (Django — :8001)
| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| POST   | /api/auth/register/   | Register new user   |
| POST   | /api/auth/login/      | Login → JWT tokens  |
| POST   | /api/auth/refresh/    | Refresh access token|
| GET    | /api/auth/me/         | Current user        |
| GET    | /api/auth/users/      | All users list      |

### Tasks (FastAPI — :8002)
| Method | Endpoint                     | Description         |
|--------|------------------------------|---------------------|
| GET    | /api/projects/               | List projects       |
| POST   | /api/projects/               | Create project      |
| GET    | /api/tasks/?project_id=...   | List tasks          |
| POST   | /api/tasks/                  | Create task         |
| PATCH  | /api/tasks/{id}              | Update task/status  |
| PATCH  | /api/tasks/{id}/assign       | Assign to user      |
| DELETE | /api/tasks/{id}              | Delete task         |
| GET    | /api/sprints/?project_id=... | List sprints        |
| POST   | /api/sprints/                | Create sprint       |

### Notifications (Flask — :8003)
| Method | Endpoint                              | Description       |
|--------|---------------------------------------|-------------------|
| GET    | /api/notifications/{user_id}          | Get notifications |
| PATCH  | /api/notifications/{user_id}/read-all | Mark all read     |

---

## 🧪 Test the API manually

```bash
# Register
curl -X POST http://localhost/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@nexus.com","password":"nexus123","full_name":"Dev User"}'

# Login → copy the access token
curl -X POST http://localhost/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@nexus.com","password":"nexus123"}'

# Create project (replace TOKEN)
curl -X POST http://localhost/api/projects/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My First Sprint","description":"Backend team","owner_id":"YOUR_USER_ID"}'

# Create task
curl -X POST http://localhost/api/tasks/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"PROJECT_ID","title":"Setup CI pipeline","priority":"high"}'
```

---

## 🐳 Docker Services

| Container              | Image                        | Purpose                    |
|------------------------|------------------------------|----------------------------|
| nginx                  | Custom                       | API Gateway                |
| auth-service           | Custom (Django 5)            | User auth + JWT            |
| task-service           | Custom (FastAPI)             | Projects / Tasks / Sprints |
| notification-service   | Custom (Flask)               | Notifications + REST       |
| celery-worker          | Custom (Celery)              | Async email jobs           |
| websocket-service      | Custom (socket.io)           | Live WS broadcast          |
| frontend               | Custom (React + Vite)        | Kanban UI                  |
| kafka                  | confluentinc/cp-kafka:7.5.0  | Event bus                  |
| zookeeper              | confluentinc/cp-zookeeper    | Kafka coordination         |
| redis                  | redis:7-alpine               | Cache + Celery broker      |
| mysql-auth             | mysql:8                      | Auth database              |
| mysql-tasks            | mysql:8                      | Tasks database             |
| mailhog                | mailhog/mailhog              | Email dev server           |
| kafka-ui               | provectuslabs/kafka-ui       | Kafka dashboard            |

---

## 📁 Project Structure

```
nexus-pm/
├── docker-compose.yml         ← One command to run everything
├── .github/workflows/ci.yml   ← GitHub Actions CI/CD
├── .env.example               ← Environment variables reference
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf             ← API Gateway config
├── services/
│   ├── auth-service/          ← Django 5 + DRF + simplejwt
│   ├── task-service/          ← FastAPI async + SQLAlchemy 2
│   ├── notification-service/  ← Flask + Celery + Kafka consumer
│   └── websocket-service/     ← socket.io + Kafka consumer
└── frontend/                  ← React + Vite + Zustand + DnD
```

---

## 💡 Key Engineering Decisions

**Why Kafka instead of direct HTTP between services?**
Services emit events and never call each other directly. Adding a Slack service or audit log requires zero changes to existing code — just add a new Kafka consumer. This is the open/closed principle at the infrastructure level.

**Why per-service databases?**
True data isolation. The auth team can migrate their schema independently. No shared ORM models, no accidental cross-service joins.

**Why FastAPI for tasks (not Django)?**
Async I/O for the highest-traffic service. Task updates, drag-drop, sprint changes — all non-blocking with SQLAlchemy 2 async sessions.

**Why socket.io rooms?**
Updates are scoped to `project_{id}` rooms. A user on Project A never receives noise from Project B. Scales cleanly.

---

## 🛑 Stop everything

```bash
docker compose down -v   # -v also removes database volumes
```
