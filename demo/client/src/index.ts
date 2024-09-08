import { LiveSocketError } from "../../../js/lib/typescript/socket/LiveSocketError.js";
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
  liveAction,
} from "live-view-model";
import {
  action,
  autorun,
  configure,
  observable,
  reaction,
  runInAction,
} from "mobx";
// import "reflect-metadata";

const failedConnection = () => {
  const connection = connect("ws://localhost:4000/lvm");
  setTimeout(() => {
    connection.disconnect();
  }, 1000);
};

// configure({
//   enforceActions: "never",
// });

@liveViewModel("room:lobby")
class LobbyViewModel {
  constructor(private conn: LiveConnection) {
    initializeLiveObservables(this);
  }

  @observable
  localCount: number = 0;

  @liveObservable("server_count")
  count: number = 0;

  @liveObservable()
  messages: string[] = [];

  @liveAction()
  setCount(count: number) {
    this.count = count;
  }

  @liveEvent("send_message")
  sendMessage(message: string): object {
    return { message };
  }

  @liveError()
  handleError(error: LiveSocketError) {
    console.log("ERROR!!!", error);
  }
}

// Example of a failed connection:
// failedConnection();

const token = "socket_token";
const conn = connect("ws://localhost:4000/lvm", { token });
const lobby = new LobbyViewModel(conn);
join(lobby);
lobby.sendMessage("Hello, world!");

const observableProperties = getLiveObservableProperties(lobby);
console.log(observableProperties);

autorun(() => {
  console.log("---");
  console.log("Update:");
  console.log("count:", lobby.count);
  console.log("foobar:", lobby.localCount);
  console.log("---");
});

lobby.setCount(1);

setTimeout(() => {
  lobby.setCount(2);
}, 50);

setTimeout(() => {
  lobby.setCount(3);
}, 100);

// setTimeout(() => {
//   setTimeout(() => leave(lobby), 1000);
// }, 2000);
