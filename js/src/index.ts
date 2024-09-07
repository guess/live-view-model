import { LiveChannel } from './channel/LiveChannel.js';
import { LiveConnection } from './connect/LiveConnection.js';
import { LiveViewModel } from './LiveViewModel.js';
import { LiveSocket } from './socket/LiveSocket.js';

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

export { liveViewModel, liveEvent } from './decorators/index.js';

export {
  // utils
  snakeToCamelCase,
  snakeToTitleCase,
} from './utils/strings.js';
export { isNotNull } from './utils/rxjs.js';

export { LiveViewModel } from './LiveViewModel.js';

export const join = (vm: unknown, params?: object) =>
  (vm as LiveViewModel).join(params);

export const leave = (vm: unknown) => (vm as LiveViewModel).leave();
