export type PhoenixSocketError = {
  type: string;
  message: string;
  code: string;
};

export type PhoenixSocketErrorEvent = {
  error: PhoenixSocketError;
};
