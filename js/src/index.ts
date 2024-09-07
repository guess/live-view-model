// socket
export {
  LiveSocket,
  LiveSocketEvent,
  LiveSocketErrorType,
  LiveSocketEventType,
  PhoenixSocket,
  PhoenixSocketError,
} from './socket/index.js';

// channel
export {
  LiveChannel,
  LiveChannelEvent,
  PhoenixChannel,
} from './channel/index.js';

// connect
export { LiveConnection, connect } from './connect/index.js';

export { liveViewModel } from './decorators/index.js';

export {
  // utils
  snakeToCamelCase,
  snakeToTitleCase,
} from './utils/strings.js';
export { isNotNull } from './utils/rxjs.js';

export type ViewModel = {
  join: (params?: object) => void;
  leave: () => void;
};

export const join = (vm: unknown, params?: object) =>
  (vm as ViewModel).join(params);

export const leave = (vm: unknown) => (vm as ViewModel).leave();
