import "./global.js";
import {
  connect,
  join,
  leave,
  liveViewModel,
  LiveConnection,
  liveEvent,
  liveError,
  liveObservable,
  LiveError,
  action,
  localObservable,
  setLogLevel,
  LogLevel,
} from "live-view-model";
import { autorun, computed } from "mobx";

setLogLevel(LogLevel.debug);

const failedConnection = () => {
  const connection = connect("ws://localhost:4000/lvm");
  setTimeout(() => {
    connection.disconnect();
  }, 1000);
};

type ChatMessage = {
  from: string;
  message: string;
};

@liveViewModel("room:lobby")
class LobbyViewModel {
  constructor(conn: LiveConnection) {}

  @localObservable()
  count: number = 0;

  @liveObservable("username")
  name: string = "";

  @liveObservable.deep()
  messages: ChatMessage[] = [];

  @action()
  setCount(count: number) {
    this.count = count;
  }

  @computed
  get messageCount() {
    return this.messages.length;
  }

  @liveEvent("send_message")
  sendMessage(message: string): object {
    return { message };
  }

  @liveError()
  handleError(error: LiveError) {
    console.error("LVM ERROR:", error);
  }
}

// Example of a failed connection:
// failedConnection();

const token = "socket_token";
const conn = connect("ws://localhost:4000/lvm", { token });
const lobby = new LobbyViewModel(conn);
join(lobby);

autorun(() => console.log("UPDATE: message count:", lobby.messageCount));
autorun(() => console.log("UPDATE: name: ", lobby.name));
autorun(() => {
  if (lobby.messages.length > 0) {
    const message = lobby.messages[0];
    console.log(`UPDATE: New message from ${message.from}:`, message.message);
  }
});
autorun(() => console.log("UPDATE: local count:", lobby.count));

lobby.sendMessage("hello!");
lobby.setCount(1);

setTimeout(() => {
  lobby.setCount(2);
}, 1000);

setTimeout(() => {
  lobby.setCount(3);
  lobby.sendMessage("goodbye");
}, 2000);

setTimeout(() => {
  lobby.setCount(4);
  leave(lobby);
}, 3000);

setTimeout(() => {
  lobby.setCount(5);
  join(lobby);
}, 4000);

setTimeout(() => {
  lobby.setCount(6);
  lobby.sendMessage("hello again");
}, 5000);
