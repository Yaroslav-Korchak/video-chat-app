import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { ExpressPeerServer } from "peer";
import path from "path";
import { fileURLToPath } from "url";

// Настройка пути к __dirname (ESM не имеет его по умолчанию)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Настройка EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Статические файлы
app.use(express.static(path.join(__dirname, "public")));

// PeerJS сервер
const peerServer = ExpressPeerServer(server, { debug: true });
app.use("/peerjs", peerServer);

// Генерация уникальной комнаты
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

// Маршрут для комнаты
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// Socket.io
const io = new Server(server);

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
