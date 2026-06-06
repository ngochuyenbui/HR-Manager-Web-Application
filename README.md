# Project Overview
This project was developed as part of the Integrated Information Systems Project course by a team of six members. It is a web-based Human Resource Management (HRM) System that helps organizations manage employee information, attendance, and payroll in a centralized platform.

## Key Features
### Account Management
- Create and manage employee accounts
- Update employee information
- View employee profiles
- Deactivate or remove former employees
### Employee Management
- Record employee attendance
- Automatically calculate salaries
- View monthly payroll information

The project demonstrates the application of information systems analysis, database design, and web development in solving HR management tasks.

## Tech Stack

### Frontend (`/my-react-app`)
- **Framework**: React 18
- **Build Tool**: Create React App (`react-scripts`)
- **Styling**: Tailwind CSS (via `@material-tailwind/react`)
- **HTTP Client**: Axios
- **Routing**: `react-router-dom` v7.9.3
- **Visualization**: Chart.js (`react-chartjs-2`)
- **Components**: Headless UI, React Custom Scrollbars 2, Lucide React, React Icons

### Backend (`/server`)
- **Language**: Java 17
- **Framework**: Spring Boot 3.2.1
- **Key Dependencies**:
  - Spring Web (REST API)
  - Spring Data JPA (Database Interaction)
  - Spring Security (Basic Security)
  - Lombok (Boilerplate reduction)
- **Build Tool**: Maven

### Database
- **System**: PostgreSQL 15
- **Setup**: Initialized via `db.sql` scripts.

### DevOps & Infrastructure
- **Containerization**: Docker, Docker Compose
- **Orchestration**: `docker-compose.yml` manages Backend and Database services.

---

## Architecture

The project follows a standard **Client-Server Architecture**:

1.  **Frontend**: A Single Page Application (SPA) built with React. It runs on the client browser and communicates with the backend via HTTP requests. During development, it proxies API requests to `http://localhost:5000`.
2.  **Backend**: A specific Spring Boot application acting as a REST API. It handles business logic and communicates with the database.
3.  **Database**: PostgreSQL database running in a container, accessible to the backend via the Docker network alias `postgres`.

---

## How to Run

### Prerequisites
- Docker Desktop installed and running.
- Node.js (v18+ recommended) and npm.

### Step 1: Start Backend & Database
From the project root directory, run:

```bash
docker-compose up -d --build
```

This will:
1.  Start the PostgreSQL database on port `5431` (host).
2.  Build and start the Spring Boot server on port `5000` (host).

*Check logs if needed: `docker-compose logs -f server`*

### Step 2: Run Frontend
Open a new terminal:

```bash
cd my-react-app
npm install
npm start
```

The application will open at `http://localhost:3000`.

### Step 3: Stop Services
To stop the backend and database containers, run:

```bash
docker-compose down
```

To stop and remove volumes (reset database):
```bash
docker-compose down -v
```
