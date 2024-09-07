import "./global.js";
import { connect, liveViewModel, LiveConnection } from "live-view-model";

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
failedConnection();

const token = "foobar";
const conn = connect("ws://localhost:4000/lvm", { token });
// const lobby = new LobbyViewModel(conn);

// const token = "foobar";
// const connection = connect("ws://localhost:4000/lvm", { token });
// console.log(connection);
