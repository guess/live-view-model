import chat from "./chat.js";
import conflict from "./conflict.js";

enum AppType {
  chat = "chat",
  conflict = "conflict",
}

const run = (type: AppType) => {
  switch (type) {
    case AppType.chat:
      chat();
      break;
    case AppType.conflict:
      conflict();
      break;
    default:
      break;
  }
};

const main = async () => {
  run(AppType.conflict);
};

main().catch(console.error);
