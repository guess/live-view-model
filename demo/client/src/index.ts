import "./global.js";
import {
  connect,
  join,
  leave,
  liveViewModel,
  LiveConnection,
  liveEvent,
  PhoenixSocketError,
  liveError,
  liveObservable,
  initializeLiveObservables,
  getLiveObservableProperties,
  action,
  LiveError,
} from "live-view-model";
import { autorun, computed, observable } from "mobx";

const failedConnection = () => {
  const connection = connect("ws://localhost:4000/lvm");
  setTimeout(() => {
    connection.disconnect();
  }, 1000);
};

// configure({
//   enforceActions: "never",
// });
//

type ChatMessage = {
  from: string;
  message: string;
};

@liveViewModel("room:lobby")
class LobbyViewModel {
  constructor(private conn: LiveConnection) {
    initializeLiveObservables(this);
  }

  @observable
  count: number = 0;

  @liveObservable("username")
  name: string = "";

  @liveObservable()
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
  lobby.sendMessage("goodbye");
}, 2000);

setTimeout(() => {
  leave(lobby);
}, 3000);

setTimeout(() => {
  join(lobby);
}, 4000);

setTimeout(() => {
  lobby.sendMessage("hello again");
}, 5000);
