const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const { Pool } = require("pg");

app.set("view engine", "ejs");
app.use(express.static("public"));

const peerServer = ExpressPeerServer(server, {
  debug: true,
});
app.use("/peerjs", peerServer);

// PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "db", // docker service name
  database: "videochat",
  password: "postgres",
  port: 5432,
});

// Главная → новая комната
app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

// Комната
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// Socket logic
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    socket.on("message", async (message) => {
      await pool.query(
        "INSERT INTO messages(content) VALUES($1)",
        [message]
      );
      io.to(roomId).emit("createMessage", message);
    });

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

server.listen(3030, () => {
  console.log("Server started on http://localhost:3030");
});
