# Full-Stack Production AI Chatbot (GPT-5.4 Mini)

A production-ready AI Chatbot application featuring a ChatGPT-style UI, real-time response streaming, session management, JWT authentication, Prisma ORM, and full Docker support.

## Features

- 🚀 **ChatGPT-Style UI**: Modern responsive design built with React, TypeScript, and Tailwind CSS.
- 🌓 **Dark / Light Mode**: Instant toggle with persistent theme state.
- ⚡ **Real-Time Streaming**: Server-Sent Events (SSE) streaming powered by OpenAI GPT-5.4 Mini.
- 📝 **Markdown & Code Highlighting**: Syntax highlighting for code blocks with dynamic **Copy Code** button.
- 💬 **Conversation Management**: Create new chats, rename titles inline, and delete sessions with ease.
- 🔐 **JWT Authentication**: Password hashing using bcrypt, rate limiting, and route protection.
- 🗄️ **Database Integration**: Prisma ORM with SQLite for instant local dev and PostgreSQL for production container setups.
- 🐳 **Docker Support**: Dockerfiles and `docker-compose.yml` for multi-container deployment.

## Project Structure

```
ai-chatbot/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── index.ts
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       └── services/
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── components/
        ├── context/
        └── services/
```

## Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Docker Deployment
```bash
docker-compose up --build
```
Access the application at `http://localhost`.
