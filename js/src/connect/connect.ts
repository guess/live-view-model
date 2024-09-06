import { LiveConnection } from '../connect/LiveConnection.js';

export function connect(url: string, params: object = {}): LiveConnection {
  const connection = new LiveConnection(url, params);
  connection.connect();
  return connection;
}
