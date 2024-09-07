import "./global.js";
import {
  connect,
  join,
  leave,
  liveViewModel,
  LiveConnection,
  liveEvent,
  ViewModel,
  PhoenixSocketError,
  liveError,
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

  @liveError()
  handleError(error: PhoenixSocketError) {
    console.log("ERROR!!!", error);
  }
}

// Example of a failed connection:
// failedConnection();

const token = "socket_token";
const conn = connect("ws://localhost:4000/lvm", { token });
const lobby = new LobbyViewModel(conn);

setTimeout(() => {
  lobby.sendMessage("Hello, world!");
  // join(lobby);
  // setTimeout(() => leave(lobby), 1000);
}, 1000);
