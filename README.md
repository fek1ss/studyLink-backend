# 🧠 StudyLink Backend

> Backend API for **StudyLink** — a social learning network that helps students create and share AI-generated quizzes, posts, and track learning progress.  
> Built with **Node.js + Express + MySQL (Sequelize ORM)**.  
> Developed by **Damir Kairzhanov** with assistance from *GitHub Copilot* and *ChatGPT 5-mini*.

---

## 🚀 Overview

StudyLink is a **social learning platform** designed to make studying collaborative and engaging.  
Students can:
- Create quizzes (manually or with AI from lecture PDFs)
- Publish quizzes and study posts
- Track progress in their personal profile

This backend provides REST API endpoints for authentication, quiz generation, post publishing, and statistics tracking.

---

## 🧩 Tech Stack

| Category | Technology |
|-----------|-------------|
| Runtime | Node.js (v18) |
| Framework | Express.js |
| Database | MySQL (via Sequelize ORM) |
| AI Integration | Google Gemini API |
| Auth | JWT (JSON Web Tokens) |
| File Upload | Multer |
| Environment Config | dotenv |
| Dev Tooling | Nodemon, Docker, Docker Compose |

---

## ⚙️ Features Implemented (MVP)

✅ User registration and login  
✅ Create and manage posts  
✅ Generate quizzes manually or via AI (Gemini API)  
✅ Take quizzes and get results  
✅ Publish quizzes to profile  
✅ View basic user statistics  

---

## 🧱 Project Structure

backend/
├── src/
│ ├── app.js # Express app setup
│ ├── server.js # Server entry point
│ ├── config/
│ │ ├── db.js # Sequelize MySQL configuration
│ │ └── gemini.js # Google Gemini API client
│ ├── controllers/ # Route handlers
│ ├── routes/ # API routes
│ ├── models/ # Sequelize models
│ └── services/
│ └── aiService.js # AI quiz generation logic
├── .env # Environment variables
├── Dockerfile # Backend Docker build config
├── docker-compose.yml # Multi-container setup (MySQL + backend)
├── package.json
└── README.md


---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```bash
DB_HOST=mysql
DB_USER=appuser
DB_PASS=apppassword
DB_NAME=appdb
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```

🐳 *Run with Docker*
Build and run:
docker-compose up --build

Check containers:
docker ps

Stop:
docker-compose down

The backend will be available at:

http://localhost:5000/


🧠 Run Locally (without Docker)

Install dependencies:

npm install


Start MySQL manually (e.g., via Workbench or XAMPP).

Run in development mode:

npm run dev


API will run at http://localhost:5000.

🔗 Example API Endpoints
Method	Endpoint	Description
POST	/api/auth/register	Register new user
POST	/api/auth/login	Login and get JWT token
POST	/api/quizzes/create	Generate quiz (manual or AI)
GET	/api/quizzes/:id	Get quiz by ID
POST	/api/posts	Create study post
GET	/api/posts/feed	Get post feed
🧰 Testing with Postman

Use Postman and set Collection Variables:

Variable	Example
baseUrl	http://localhost:5000
authToken	(auto set after login)

Example Tests script for /login:

const data = pm.response.json();
pm.collectionVariables.set("authToken", data.token);
pm.collectionVariables.set("userId", data.user.id);

🧪 AI Quiz Generation

Implemented in src/services/aiService.js.

When a user uploads a lecture file or text,
the backend sends it to Google Gemini API using the helper in src/config/gemini.js,
which returns structured quiz questions in JSON format.

🛠️ Future Features

Mind map generation from lectures (AI)

Comments under posts and quizzes

Gamification & badges system

University-level analytics dashboard

💡 Developed With

This project was created entirely with the help of AI tools:

GitHub Copilot for code generation and refactoring

**ChatGPT 5-mini for architecture, API design, Docker setup, and documentation**