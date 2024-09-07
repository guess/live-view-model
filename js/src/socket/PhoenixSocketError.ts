export type PhoenixSocketError = {
  type?: string;
  message?: string;
  reason?: string;
  code?: string;
};

export type PhoenixSocketErrorEvent = {
  error: PhoenixSocketError;
};
