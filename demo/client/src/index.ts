import "./global.js";
import { connect } from "live-view-model";

const failedConnection = () => {
  const connection = connect("ws://localhost:4000/lvm");
  setTimeout(() => {
    connection.disconnect();
  }, 1000);
};

const successfulConnection = () => {
  const token = "foobar";
  const connection = connect("ws://localhost:4000/lvm", { token });
  setTimeout(() => {
    connection.disconnect();
  }, 1000);
};

// failedConnection();
successfulConnection();

// const token = "foobar";
// const connection = connect("ws://localhost:4000/lvm", { token });
// console.log(connection);
