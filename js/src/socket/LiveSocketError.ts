// externally exposed errors
export type LiveSocketError = {
  type: string;
  message: string;
  code?: string;
  error?: object;
};
