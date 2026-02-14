const socket = io("/");
const videoGrid = document.getElementById("video-grid");

const myVideo = document.createElement("video");
myVideo.muted = true;

const peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3030",
});

let myVideoStream;
const peers = {};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });

      call.on("close", () => video.remove());

      peers[call.peer] = call;
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");

  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });

  call.on("close", () => video.remove());

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => video.play());
  videoGrid.append(video);
}

// CHAT
const chatInput = document.getElementById("chatInput");
const messages = document.getElementById("messages");

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && chatInput.value.trim() !== "") {
    socket.emit("message", username + ": " + chatInput.value);
    chatInput.value = "";
  }
});

socket.on("createMessage", (message) => {
  const li = document.createElement("li");
  li.innerText = message;
  messages.append(li);
});

// CONTROLS
const muteButton = document.getElementById("muteButton");
const videoButton = document.getElementById("videoButton");
const leaveButton = document.getElementById("leaveButton");

muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  myVideoStream.getAudioTracks()[0].enabled = !enabled;
  muteButton.innerText = enabled ? "Unmute" : "Mute";
});

videoButton.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  myVideoStream.getVideoTracks()[0].enabled = !enabled;
  videoButton.innerText = enabled ? "Start Video" : "Stop Video";
});

leaveButton.addEventListener("click", () => {
  window.location.href = "/";
});
