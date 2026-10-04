# 🚀 Nexus AI Backend Architecture

A scalable, production-oriented backend infrastructure built with **Node.js/Express**, **MongoDB**, and **Redis**, orchestrated with **Docker Compose** and exposed through **Nginx** as a **Layer 7 Reverse Proxy** and **Load Balancer**.

---

## 📐 Infrastructure & Architecture

```text
[ Client / Browser / Postman ]
              │
              │ HTTP
              ▼
        localhost:8080
              │
              ▼
┌───────────────────────────────────────────────┐
│              Docker Environment               │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │       Nginx Reverse Proxy / Gateway     │  │
│  │              :80                        │  │
│  └────────────────────┬────────────────────┘  │
│                       │                       │
│                       │ HTTP                  │
│                       ▼                       │
│  ┌─────────────────────────────────────────┐  │
│  │     Node.js / Express Application       │  │
│  │       nexus-ai-server :3005             │  │
│  └────────────────────┬────────────────────┘  │
│                       │                       │
│             ┌─────────┴─────────┐             │
│             ▼                   ▼             │
│      ┌─────────────┐      ┌─────────────┐    │
│      │   MongoDB   │      │    Redis    │    │
│      │    :27017   │      │    :6379    │    │
│      └─────────────┘      └─────────────┘    │
│                                               │
│       Docker Bridge Network + DNS             │
└───────────────────────────────────────────────┘
```

### Request Flow

```text
Client
  │
  │ http://localhost:8080/api/...
  ▼
Nginx
  │
  │ http://nexus-ai-server:3005
  ▼
Node.js / Express
  │
  ├──► MongoDB
  │
  └──► Redis
```

The important networking concept is that the client only communicates with **Nginx**. Internal services communicate with each other through the Docker network using **service names**, not `localhost`.

---

# 🛠 Tech Stack

| Technology            | Purpose                            |
| --------------------- | ---------------------------------- |
| Node.js               | Backend runtime                    |
| Express.js            | HTTP API framework                 |
| MongoDB               | Primary database                   |
| Mongoose              | MongoDB ODM                        |
| Redis                 | Caching / session management       |
| Nginx                 | Reverse proxy / load balancer      |
| Docker                | Containerization                   |
| Docker Compose        | Multi-container orchestration      |
| Docker Bridge Network | Internal service communication     |
| HTTP/1.1              | Application-level network protocol |

---

# 🌐 Networking & DevOps Concepts

## 1. Layer 7 Reverse Proxy

Nginx works as the single entry point for incoming HTTP traffic.

```text
Client
   │
   │ HTTP :8080
   ▼
 Nginx
   │
   │ HTTP :3005
   ▼
Node.js
```

The client does **not** need to know the internal Node.js container address.

Instead of:

```text
http://localhost:3005/api/health
```

the client uses:

```text
http://localhost:8080/api/health
```

Nginx receives the request and forwards it to the backend.

---

## 2. Docker Internal DNS

Inside the Docker network, containers can communicate using service names.

For example:

```text
http://nexus-ai-server:3005
```

and:

```text
mongodb://mongo:27017/nexus_ai
```

and:

```text
redis://redis:6379
```

Docker provides internal DNS resolution.

Conceptually:

```text
nexus-ai-server ──► Docker DNS ──► Node.js container
mongo            ──► Docker DNS ──► MongoDB container
redis            ──► Docker DNS ──► Redis container
```

### Important

Inside a container:

```text
localhost
```

means **that same container**.

Therefore, Node.js should not use:

```text
mongodb://localhost:27017
```

to connect to MongoDB.

Instead:

```text
mongodb://mongo:27017/nexus_ai
```

because MongoDB is running in another container.

---

# 🔒 3. Isolated Docker Network

The services communicate through a private Docker bridge network.

```text
                    Docker Network
┌─────────────────────────────────────────────────┐
│                                                 │
│  Nginx ──────► Node.js ──────► MongoDB         │
│                  │                              │
│                  └────────────► Redis           │
│                                                 │
└─────────────────────────────────────────────────┘
```

MongoDB and Redis do not need to be publicly accessible.

Recommended architecture:

```text
Internet
   │
   ▼
Nginx :8080
   │
   ▼
Node.js :3005
   │
   ├──► MongoDB :27017
   └──► Redis :6379
```

Only the required entry point should be exposed to the host.

---

# ❤️ 4. Health Check

The application provides:

```text
GET /api/health
```

Example response:

```json
{
  "status": "OK",
  "containerId": "834ed089e126",
  "uptime": 214.46
}
```

This endpoint can be used to determine whether a backend instance is alive.

Typical use cases:

- Docker health checks
- Load balancer checks
- Monitoring
- Debugging
- Container orchestration

---

# 🔎 5. Container Identification

Every response can include:

```http
X-Served-By: 834ed089e126
```

The value comes from the Node.js process:

```js
os.hostname();
```

This makes it possible to identify which container handled the request.

For example:

```text
Request #1 → container A
Request #2 → container B
Request #3 → container C
```

This becomes especially useful when multiple backend replicas are running.

---

# ⚖️ 6. Load Balancing

The backend can be scaled horizontally.

For example:

```bash
docker compose up -d --scale nexus-ai-server=3
```

The architecture becomes:

```text
                    ┌──► Node.js #1
                    │
Client ──► Nginx ───┼──► Node.js #2
                    │
                    └──► Node.js #3
```

Nginx can distribute requests between the available backend instances using **Round Robin**.

Example:

```text
Request 1 → Node.js #1
Request 2 → Node.js #2
Request 3 → Node.js #3
Request 4 → Node.js #1
...
```

---

# 🚀 Getting Started

## Prerequisites

Install:

- Docker Desktop
- Git

Verify Docker:

```bash
docker --version
docker compose version
```

---

# 📥 Installation

Clone the repository:

```bash
git clone https://github.com/your-username/nexus-ai-backend.git
```

Enter the project:

```bash
cd nexus-ai-backend
```

---

# 🔐 Environment Variables

Create a `.env` file in the project root:

```env
PORT=3005
MONGO_URI=mongodb://mongo:27017/nexus_ai
REDIS_URL=redis://redis:6379
```

### Why these URLs?

The important part is the hostname:

```text
mongo
redis
```

These are Docker Compose service names.

They are resolved automatically through Docker's internal DNS.

---

# 🐳 Run the Application

Build and start all services:

```bash
docker compose up -d --build
```

Check running containers:

```bash
docker compose ps
```

Expected architecture:

```text
nginx
nexus-ai-server
mongo
redis
```

---

# 🧪 Testing

## 1. Health Check

Run:

```bash
curl http://localhost:8080/api/health
```

Expected response:

```json
{
  "status": "OK",
  "containerId": "834ed089e126",
  "uptime": 214.46
}
```

---

## 2. Inspect HTTP Headers

Run:

```bash
curl -i http://localhost:8080/api/health
```

Example:

```http
HTTP/1.1 200 OK
Server: nginx/1.28.3
X-Served-By: 834ed089e126
Content-Type: application/json; charset=utf-8
```

The important header is:

```text
X-Served-By
```

It shows which backend container processed the request.

---

# 📜 Logs

View Node.js logs:

```bash
docker compose logs -f nexus-ai-server
```

View Nginx logs:

```bash
docker compose logs -f nginx
```

View all services:

```bash
docker compose logs -f
```

---

# 🔍 Inspect Docker Network

List Docker networks:

```bash
docker network ls
```

Inspect a network:

```bash
docker network inspect <network-name>
```

This allows you to see which containers are connected to the same network.

---

# 📦 Useful Docker Commands

### Start services

```bash
docker compose up -d
```

### Rebuild services

```bash
docker compose up -d --build
```

### Stop services

```bash
docker compose down
```

### Show running containers

```bash
docker compose ps
```

### Follow logs

```bash
docker compose logs -f
```

### Restart a service

```bash
docker compose restart nexus-ai-server
```

### Open a shell inside a container

```bash
docker exec -it <container-name> sh
```

---

# ⚡ Scaling the Backend

Run three backend replicas:

```bash
docker compose up -d --scale nexus-ai-server=3
```

Check them:

```bash
docker compose ps
```

You should see multiple instances:

```text
nexus-ai-server-1
nexus-ai-server-2
nexus-ai-server-3
```

Then test:

```bash
curl -i http://localhost:8080/api/health
```

Run it multiple times and observe:

```text
X-Served-By: container-1
X-Served-By: container-2
X-Served-By: container-3
```

This demonstrates that Nginx is distributing traffic between backend replicas.

---

# 🧠 Networking Concepts Demonstrated

This project is useful for learning the following real-world concepts:

### HTTP

```text
Client → Nginx → Node.js
```

### Ports

```text
Host :8080
      ↓
Nginx :80
      ↓
Node.js :3005
```

### Docker Networking

```text
Container → Container
```

### DNS

```text
nexus-ai-server
mongo
redis
```

### Reverse Proxy

```text
Client → Nginx → Backend
```

### Layer 7

Nginx understands HTTP requests and can route based on:

```text
/api/*
```

### Load Balancing

```text
Nginx
 ├──► Backend #1
 ├──► Backend #2
 └──► Backend #3
```

### Service Isolation

MongoDB and Redis remain inside the internal Docker network.

### Observability

```text
/api/health
X-Served-By
docker compose logs
```

---

# 🏗️ Production Architecture

A production deployment could evolve into:

```text
                    Internet
                       │
                       ▼
                ┌──────────────┐
                │    Nginx     │
                │ Reverse Proxy│
                └──────┬───────┘
                       │
              ┌────────┼────────┐
              ▼        ▼        ▼
           Node #1  Node #2  Node #3
              │        │        │
              └────────┼────────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
           MongoDB            Redis
```

For a larger production system, additional components could be introduced:

- TLS/HTTPS
- Domain name
- CI/CD
- Monitoring
- Centralized logging
- Secrets management
- Managed MongoDB
- Redis cluster
- Kubernetes
- Cloud load balancer
- Auto-scaling

---

# 🎯 What This Project Teaches

This project is more than a Node.js backend. It demonstrates how an application behaves as a **networked system**.

The most important request path to understand is:

```text
Browser
   │
   │ HTTP request
   ▼
localhost:8080
   │
   ▼
Nginx
   │
   │ Docker DNS
   ▼
nexus-ai-server:3005
   │
   ├──────────────► mongo:27017
   │
   └──────────────► redis:6379
```

