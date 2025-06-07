const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const lobbies = new Map();

io.on("connection", (socket) => {
  socket.on("createLobby", ({ lobbyName, nickname }) => {
    const id = uuidv4();
    const lobby = {
      id,
      name: lobbyName,
      owner: nickname,
      players: [{ id: socket.id, nickname }]
    };
    lobbies.set(id, lobby);
    socket.join(id);
    io.to(socket.id).emit("lobbyJoined", { lobby, players: lobby.players });
  });

  socket.on("getLobbies", () => {
    const list = Array.from(lobbies.values()).map((l) => ({
      id: l.id,
      name: l.name,
      players: l.players
    }));
    io.to(socket.id).emit("lobbyList", list);
  });

  socket.on("joinLobby", ({ lobbyId, nickname }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby || lobby.players.length >= 20) return;
    lobby.players.push({ id: socket.id, nickname });
    socket.join(lobbyId);
    io.to(lobbyId).emit("lobbyJoined", { lobby, players: lobby.players });
  });

  socket.on("startGame", ({ lobbyId }) => {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;
    io.to(lobbyId).emit("gameStarted");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
