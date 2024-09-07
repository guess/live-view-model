import { LiveChannel } from './channel/LiveChannel.js';
import { LiveConnection } from './connect/LiveConnection.js';

export type LiveViewModel = {
  topic: string;
  join: (params?: object) => void;
  leave: () => void;
  channel: LiveChannel;
  connection: LiveConnection;
};
