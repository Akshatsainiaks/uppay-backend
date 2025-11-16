import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

const socket = io(URL, {
  transports: ["websocket"],
  autoConnect: false,
  reconnectionAttempts: 5
});

export default socket;

export const connectSocket = () => {
  if (!socket.connected) socket.connect();
  return socket;
};

export const joinBoard = (boardId) => {
  if (!boardId) return;
  socket.emit("joinBoard", boardId);
};

export const leaveBoard = (boardId) => {
  if (!boardId) return;
  socket.emit("leaveBoard", boardId);
};

export const emitTaskCreate = (data) => socket.emit("task:create", data);
export const emitTaskUpdate = (data) => socket.emit("task:update", data);
export const emitTaskDelete = (data) => socket.emit("task:delete", data);
export const emitActivityAdd = (data) => socket.emit("activity:add", data);
export const scheduleReminder = (data) => socket.emit("scheduleReminder", data);
export const cancelReminder = (data) => socket.emit("cancelReminder", data);
export const shareBoardLink = (data) => socket.emit("shareBoardLink", data);
