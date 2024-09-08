import { LiveViewModel } from './view-model/liveViewModel.js';

// Phoenix
export { PhoenixChannel } from './phoenix/PhoenixChannel.js';
export { PhoenixChannelError } from './phoenix/PhoenixChannelError.js';
export { PhoenixSocket } from './phoenix/PhoenixSocket.js';
export { PhoenixSocketError } from './phoenix/PhoenixSocketError.js';

// Socket
export { LiveSocket } from './socket/LiveSocket.js';
export { LiveSocketError } from './socket/LiveSocketError.js';
export { LiveSocketErrorType } from './socket/LiveSocketErrorType.js';
export { LiveSocketEvent } from './socket/LiveSocketEvent.js';
export { LiveSocketEventType } from './socket/LiveSocketEventType.js';

// Channel
export { LiveChannel } from './channel/LiveChannel.js';
export { LiveChannelEvent } from './channel/LiveChannelEvent.js';

// Connect
export { LiveConnection } from './connect/LiveConnection.js';
export { connect } from './connect/connect.js';

// Live View Model
export { action } from './view-model/action.js';
export { liveError } from './view-model/liveError.js';
export { liveEvent } from './view-model/liveEvent.js';
export { liveViewModel, LiveViewModel } from './view-model/liveViewModel.js';
export {
  liveObservable,
  initializeLiveObservables,
  getLiveObservableProperties,
} from './view-model/liveObservable.js';

export {
  // utils
  snakeToCamelCase,
  snakeToTitleCase,
} from './utils/strings.js';
export { isNotNull } from './utils/rxjs.js';

export const join = (vm: unknown, params?: object) =>
  (vm as LiveViewModel).join(params);

export const leave = (vm: unknown) => (vm as LiveViewModel).leave();
