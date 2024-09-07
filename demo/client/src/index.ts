import "./global.js";
import {
  connect,
  join,
  leave,
  liveViewModel,
  LiveConnection,
  liveEvent,
  ViewModel,
} from "live-view-model";

const failedConnection = () => {
  const connection = connect("ws://localhost:4000/lvm");
  setTimeout(() => {
    connection.disconnect();
  }, 1000);
};

@liveViewModel("room:lobby")
class LobbyViewModel {
  constructor(private conn: LiveConnection) {}

  @liveEvent("send_message")
  sendMessage(message: string): object {
    return { message };
  }
}

// Example of a failed connection:
// failedConnection();

const token = "socket_token";
const conn = connect("ws://localhost:4000/lvm", { token });
const lobby = new LobbyViewModel(conn);
join(lobby);
lobby.sendMessage("Hello, world!");
setTimeout(() => leave(lobby), 1000);
