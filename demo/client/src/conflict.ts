import {
  action,
  connect,
  join,
  LiveConnection,
  liveEvent,
  liveObservable,
  liveViewModel,
  LiveViewModel,
} from "live-view-model";
import { autorun } from "mobx";

// Declaration merging
interface MyViewModel extends LiveViewModel {}

// Usage
@liveViewModel("conflict")
class MyViewModel {
  constructor(_conn: LiveConnection) {}

  @liveObservable()
  count: number = 0;

  @action()
  @liveEvent("update_count")
  incrementCount() {
    this.count = this.count + 1;
    return { count: this.count };
  }
}

export default async () => {
  const token = "socket_token";
  const conn = connect("ws://localhost:4000/lvm", { token });
  const vm = new MyViewModel(conn);
  join(vm);
  incrementCount(vm);

  autorun(() => console.log("Count: ", vm.count));
};

const incrementCount = (vm: MyViewModel) => {
  vm.incrementCount();

  setTimeout(() => {
    incrementCount(vm);
  }, 200);
};
