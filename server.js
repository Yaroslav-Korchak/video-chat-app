import express from "express";
import { createServer } from "http";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";
import { ExpressPeerServer } from "peer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);
const peerServer = ExpressPeerServer(server, { debug: true });

app.set("view engine", "ejs");
app.use("/peerjs", peerServer);
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => res.redirect(`/${uuidv4()}`));
app.get("/:room", (req, res) => res.render("room", { roomId: req.params.room }));

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
  });
});

server.listen(3030, () => console.log("Server started on port 3030"));
