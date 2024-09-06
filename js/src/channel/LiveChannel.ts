import { LiveSocket } from '../socket/LiveSocket.js';

export type LiveChannelParams = {
  topic: string;
  params?: object;
};

export class LiveChannel {
  constructor(
    private socket: LiveSocket,
    private params: LiveChannelParams
  ) {}
}
