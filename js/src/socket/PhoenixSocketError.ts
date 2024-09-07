// errors received from websockets and longpoll
export type PhoenixSocketError = {
  type?: string;
  message?: string;
  reason?: string;
  code?: string;
};

export type PhoenixSocketErrorEvent = {
  error: PhoenixSocketError;
};

export const phoenixSocketErrorKeys = ['type', 'message', 'reason', 'code'];
