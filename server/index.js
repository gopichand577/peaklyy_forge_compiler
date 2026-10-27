require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const { WebSocketServer } = require("ws");

const compilerRoutes = require("./routes/compilerRoutes");
const { executionRateLimiter } = require("./utils/rateLimiter");
const { startInteractiveSession } = require("./services/interactiveExecution");
const { installJdk } = require("./scripts/install-jdk");

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Rate limit compiler execution routes
app.use("/api/compiler/run", executionRateLimiter);

// Health check endpoint
app.get(["/", "/api", "/api/health"], (req, res) => {
  res.json({
    status: "OK",
    service: "Peaklyy Forge Compiler Backend",
    uptime: `${Math.round(process.uptime())}s`,
    timestamp: new Date().toISOString(),
  });
});

// Mount P0 Compiler routes
app.use("/api/compiler", compilerRoutes);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize WebSocket server on /ws/compiler
const wss = new WebSocketServer({ server, path: "/ws/compiler" });

wss.on("connection", (ws) => {
  let activeSession = null;

  ws.on("message", (messageRaw) => {
    try {
      const msg = JSON.parse(messageRaw.toString());

      if (msg.type === "run") {
        if (activeSession) {
          activeSession.kill();
          activeSession = null;
        }

        const { language, code, files, input, interactive, closeStdin } = msg;

        ws.send(JSON.stringify({ type: "status", status: "RUNNING" }));

        activeSession = startInteractiveSession({
          language,
          code,
          files: files || [],
          initialInput: input || "",
          interactive: Boolean(interactive),
          closeStdin: Boolean(closeStdin),
          onPrompt: (promptText) => {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({ type: "prompt", data: promptText }));
            }
          },
          onStdout: (data) => {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({ type: "stdout", data }));
            }
          },
          onStderr: (data) => {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({ type: "stderr", data }));
            }
          },
          onComplete: (result) => {
            activeSession = null;
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify({ type: "complete", result }));
            }
          },
        });
      } else if (msg.type === "stdin") {
        if (activeSession) {
          activeSession.writeStdin(msg.data || "");
        }
      } else if (msg.type === "eof") {
        if (activeSession && typeof activeSession.endStdin === "function") {
          activeSession.endStdin();
        }
      } else if (msg.type === "kill") {
        if (activeSession) {
          activeSession.kill();
          activeSession = null;
        }
      }
    } catch (err) {
      console.error("WS error handling message:", err);
    }
  });

  ws.on("close", () => {
    if (activeSession) {
      activeSession.kill();
      activeSession = null;
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Peaklyy Forge running on http://localhost:${PORT}`);
  console.log(`⚡ WebSocket interactive terminal ready on ws://localhost:${PORT}/ws/compiler`);
  installJdk().catch((err) => {
    console.error("[JDK Setup] Error during startup JDK check:", err.message);
  });
});