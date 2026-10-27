# Peaklyy Forge Compiler

**Peaklyy Forge Compiler** is a high-performance, developer-focused cloud IDE and multi-language code execution engine built for interactive compilation, standard input streaming, and real-time observability.

---

## 🚀 Key Features

### 1. Multi-Language Online IDE (Compiler Mode)
- **Monaco Editor Integration**: Full-featured code editor with syntax highlighting, line wrapping, custom fonts, and theme support.
- **Multi-File & Multi-Project Workspaces**: Create, rename, delete, and switch between multiple files and project folders.
- **Interactive Stdin/Stdout**: Real-time terminal streaming over WebSockets with standard input prompt handling.
- **Live HTML/CSS Web Preview**: Sandboxed real-time rendering of web applications.
- **Multi-Language Runtime Support**:
  - Python (`.py`)
  - Java (`.java`)
  - JavaScript (`.js`)
  - HTML (`.html`)
  - CSS (`.css`)
  - C++ (`.cpp`)
<img width="551" height="487" alt="image" src="https://github.com/user-attachments/assets/5bd89235-96ed-4dcc-9523-254002db78e3" />

### 2. Algorithmic Challenge & Judge Platform (Practice Mode)
- **Problem Catalog**: Filter by topics (Arrays, DP, Strings, Math, etc.), difficulty levels (Easy, Medium, Hard), and completion status.
- **Automated Judge**: Run against sample test cases or custom inputs; submit for full test-suite grading with Score, Runtime (ms), and Memory metrics.
- **Submission History & Code Snapshot Restore**: Review past verdicts and restore previous solution snapshots with a single click.
- **Auto-Save & Local Recovery**: Debounced auto-save with offline local storage fallback.

### 3. Observability & Monitoring Dashboard
- **Real-Time System Metrics**: Total executions, system error rates, average latency, and success rates.
- **Recent Execution Logs**: Live inspection of language execution performance, exit codes, and timestamps.

---

## 🏗️ Architecture & Tech Stack

```
Peaklyy_Forge/
├── client/                     # React 18 + Vite Frontend SPA
│   ├── src/
│   │   ├── components/         # Modular UI Subsystems
│   │   │   ├── common/         # Splitters, Badges, Modals, Command Palette
│   │   │   ├── console/        # Terminal Output and Stdin Console
│   │   │   ├── editor/         # Monaco Editor & Language Selectors
│   │   │   ├── layout/         # Header Navbar and Navigation Sidebar
│   │   │   ├── monitoring/     # Real-time Metrics Dashboard
│   │   │   ├── practice/       # Problem Catalog, Judge Panels, Modals
│   │   │   └── preview/        # Live HTML/CSS Preview
│   │   ├── constants/          # Language metadata, starter templates
│   │   ├── context/            # Global Editor Context & State Management
│   │   ├── services/           # REST API & WebSocket client
│   │   └── utils/              # Resizable hooks, Monaco themes
│   └── vercel.json             # SPA routing rewrite configuration
├── server/                     # Node.js + Express + WebSocket Backend
│   ├── config/                 # Environment & server configuration
│   ├── controllers/            # Compiler, Judge, and Monitoring controllers
│   ├── routes/                 # API endpoint routers
│   ├── runtimes/               # Language execution runners
│   └── services/               # Interactive execution & queue services
├── package.json                # Monorepo root scripts
└── vercel.json                 # Vercel deployment configuration
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- *(Optional for backend compilation)*: Python 3, OpenJDK, GCC/G++ installed locally.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/peaklyy-forge.git
   cd peaklyy-forge
   ```

2. **Install Client Dependencies**:
   ```bash
   cd client
   npm install
   ```

3. **Install Server Dependencies**:
   ```bash
   cd ../server
   npm install
   ```

---

## 💻 Local Development

Run the frontend and backend concurrently:

### Start Backend Server:
```bash
cd server
npm run dev
# Starts API server on http://localhost:5000 and WS on ws://localhost:5000/ws/compiler
```

### Start Frontend Client:
```bash
cd client
npm run dev
# Vite dev server running at http://localhost:5173
```

---

## 🌐 Environment Configuration

### Client (`client/.env`)
Create a `.env` file in the `client/` folder:
```env
VITE_COMPILER_API_URL=http://localhost:5000/api
VITE_COMPILER_WS_URL=ws://localhost:5000
```

### Server (`server/.env`)
Create a `.env` file in the `server/` folder:
```env
PORT=5000
NODE_ENV=production
CLIENT_ORIGIN=http://localhost:5173
EXECUTION_TIMEOUT_MS=10000
```

---

## 📦 Deployment Guide

### Deploying Frontend to Vercel

The repository is pre-configured with root and client `vercel.json` files for zero-config Vercel deployment.

1. **Import the repository into Vercel**.
2. **Framework Preset**: `Vite`
3. **Build Command**: `npm --prefix client run build`
4. **Output Directory**: `client/dist`
5. **Environment Variables**:
   - Set `VITE_COMPILER_API_URL` to your production backend URL (e.g., `https://api.yourdomain.com/api`).
   - Set `VITE_COMPILER_WS_URL` to your production WebSocket URL (e.g., `wss://api.yourdomain.com`).

### Deploying Backend

The backend can be hosted on any Node.js compatible platform (Render, Railway, Fly.io, AWS EC2, DigitalOcean):

```bash
cd server
npm start
```

---

## 🔒 Security & Sandboxing

- **Rate Limiting**: Integrated execution limiter prevents abuse and CPU throttling.
- **Process Isolation & Timeouts**: Subprocesses are terminated automatically if execution exceeds `EXECUTION_TIMEOUT_MS`.
- **Sanitized I/O**: File paths and inputs are sanitized to prevent directory traversal.

---

## 📄 License

This project is licensed under the MIT License.
