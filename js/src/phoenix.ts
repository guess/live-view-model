export { Channel as PhoenixChannel } from '@guess/phoenix-js';

export type PhoenixChannelError = {
  reason: string;
};

export { Socket as PhoenixSocket } from '@guess/phoenix-js';

// errors received from websockets and longpoll
export type PhoenixSocketError = {
  type?: string;
  message?: string;
  reason?: string;
  code?: string;
};

export const phoenixSocketErrorKeys = ['type', 'message', 'reason', 'code'];

export type PhoenixSocketErrorEvent = {
  error: PhoenixSocketError;
};
