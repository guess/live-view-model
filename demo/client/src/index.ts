import "./global.js";
import { connect, join, liveViewModel, LiveConnection } from "live-view-model";

const failedConnection = () => {
  const connection = connect("ws://localhost:4000/lvm");
  setTimeout(() => {
    connection.disconnect();
  }, 1000);
};

@liveViewModel("room:lobby")
class LobbyViewModel {
  constructor(private conn: LiveConnection) {
    console.log("LobbyViewModel constructor");
  }
}

// Example of a failed connection:
// failedConnection();

const token = "socket_token";
const conn = connect("ws://localhost:4000/lvm", { token });
const lobby = new LobbyViewModel(conn);
join(lobby);

// const token = "foobar";
// const connection = connect("ws://localhost:4000/lvm", { token });
// console.log(connection);
