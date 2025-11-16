const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const reminders = new Map();

function log(event, data) {
  console.log(`[${new Date().toISOString()}] ${event}`, data || "");
}

io.on("connection", (socket) => {
  log("socket_connected", socket.id);

  socket.on("joinBoard", (boardId) => {
    if (!boardId) return;
    socket.join(boardId);
    log("joinBoard", { socket: socket.id, boardId });
  });

  socket.on("leaveBoard", (boardId) => {
    if (!boardId) return;
    socket.leave(boardId);
    log("leaveBoard", { socket: socket.id, boardId });
  });

  socket.on("task:create", (payload) => {
    if (!payload || !payload.boardId) return;
    io.to(payload.boardId).emit("task:created", payload);
    log("task:create", { boardId: payload.boardId, task: payload.task?.id });
  });

  socket.on("task:update", (payload) => {
    if (!payload || !payload.boardId) return;
    io.to(payload.boardId).emit("task:updated", payload);
    log("task:update", { boardId: payload.boardId, task: payload.task?.id });
  });

  socket.on("task:delete", (payload) => {
    if (!payload || !payload.boardId) return;
    io.to(payload.boardId).emit("task:deleted", payload);
    log("task:delete", { boardId: payload.boardId, taskId: payload.taskId });
  });

  socket.on("activity:add", (payload) => {
    if (!payload || !payload.boardId) return;
    io.to(payload.boardId).emit("activity:added", payload);
    log("activity:add", { boardId: payload.boardId, activity: payload.activity?.id });
  });

  socket.on("scheduleReminder", (payload) => {
    if (!payload || !payload.boardId || !payload.taskId || !payload.dueAt) return;
    const key = `${payload.boardId}:${payload.taskId}`;
    if (reminders.has(key)) {
      clearTimeout(reminders.get(key).timer);
      reminders.delete(key);
    }
    const now = Date.now();
    const target = new Date(payload.dueAt).getTime();
    const delay = Math.max(0, target - now);
    const timer = setTimeout(() => {
      const activity = {
        id: "a_" + (Math.random().toString(36).slice(2, 10)),
        text: `Reminder: task ${payload.taskId} is due`,
        time: new Date().toISOString(),
        taskId: payload.taskId
      };
      io.to(payload.boardId).emit("activity:added", { boardId: payload.boardId, activity });
      io.to(payload.boardId).emit("reminder", { boardId: payload.boardId, taskId: payload.taskId, dueAt: payload.dueAt });
      reminders.delete(key);
      log("reminder_fired", { key });
    }, delay);
    reminders.set(key, { timer, dueAt: payload.dueAt });
    log("scheduleReminder", { key, delay });
  });

  socket.on("cancelReminder", (payload) => {
    if (!payload || !payload.boardId || !payload.taskId) return;
    const key = `${payload.boardId}:${payload.taskId}`;
    if (reminders.has(key)) {
      clearTimeout(reminders.get(key).timer);
      reminders.delete(key);
      log("reminder_canceled", { key });
    }
  });

  socket.on("shareBoardLink", (payload) => {
    if (!payload || !payload.boardId) return;
    io.to(payload.boardId).emit("board:shared", payload);
    log("board:shared", payload);
  });

  socket.on("disconnect", () => {
    log("socket_disconnected", socket.id);
  });
});

app.get("/", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => log("server_running", PORT));
