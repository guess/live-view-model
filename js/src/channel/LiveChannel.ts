import { ConnectionStatus } from '../connect/ConnectionStatus.js';
import { LiveSocket } from '../socket/LiveSocket.js';
import { PhoenixChannel } from './PhoenixChannel.js';
import {
  PhoenixSocketError,
  PhoenixSocketErrorEvent,
} from '../socket/PhoenixSocketError.js';
import { LiveSocketEventType } from '../socket/LiveSocketEventType.js';
import { LiveSocketErrorType } from '../socket/LiveSocketErrorType.js';

export type LiveChannelParams = {
  topic: string;
  params?: object;
};

export class LiveChannel {
  private channel: PhoenixChannel;
  private status: ConnectionStatus = ConnectionStatus.disconnected;

  constructor(
    private socket: LiveSocket,
    params: LiveChannelParams
  ) {
    this.channel = socket.channel(params.topic, params.params);
  }

  /** connect to socket and join channel. will do nothing if already connected */
  join(): void {
    if (this.status === ConnectionStatus.disconnected) {
      this.setStatus(ConnectionStatus.connecting);
      this.channel.onError((event: PhoenixSocketErrorEvent) =>
        this.emitError('channel', event.error)
      );
      this.channel
        .join()
        .receive('ok', (resp: object) => {
          console.debug('TODO: channel joined', resp);
          this.setStatus(ConnectionStatus.connected);
        })
        .receive('error', (event: PhoenixSocketErrorEvent) => {
          console.debug('TODO: channel join error', event);
          this.emitError('channel-join', event.error);
        });
      // this.channel.on('state:change', (state: LiveStateChange) =>
      //   this.handleChange(state)
      // );
      // this.channel.on('state:patch', (patch: LiveStatePatch) =>
      //   this.handlePatch(patch)
      // );
      this.channel.on('error', (event: PhoenixSocketErrorEvent) => {
        console.debug('TODO: server error', event);
        this.emitError('server', event.error);
      });
      this.channel.onClose(() => {
        console.debug('TODO: channel closed');
        this.setStatus(ConnectionStatus.disconnected);
      });
    }
  }

  /** leave channel and disconnect from socket */
  leave(): void {
    this.channel?.leave();
  }

  get topic(): string {
    return this.channel.topic;
  }

  private emitEvent(event: LiveSocketEventType, payload?: object) {
    this.socket.emitEvent(this.topic, event, payload);
  }

  private emitError(type: LiveSocketErrorType, error: PhoenixSocketError) {
    this.socket.emitError(this.topic, type, error);
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.emitEvent('lvm-connect', { status: this.status });
  }
}
