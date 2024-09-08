import { ConnectionStatus } from '../connect/ConnectionStatus.js';
import { LiveSocket } from '../socket/LiveSocket.js';
import { PhoenixChannel } from '../phoenix/PhoenixChannel.js';
import { LiveSocketErrorType } from '../socket/LiveSocketErrorType.js';
import { LiveSocketEventType } from '../socket/LiveSocketEventType.js';
import { PhoenixChannelError } from '../phoenix/PhoenixChannelError.js';
import { PhoenixSocketError } from 'src/phoenix/PhoenixSocketError.js';
import { PhoenixSocketErrorEvent } from 'src/phoenix/PhoenixSocketErrorEvent.js';

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
      this.channel.onError((event?: PhoenixSocketErrorEvent) => {
        // console.log('channel error', event);
        this.emitError('channel', event?.error);
      });
      this.channel
        .join()
        .receive('ok', () => {
          this.setStatus(ConnectionStatus.connected);
        })
        .receive('error', (error: PhoenixChannelError) => {
          this.emitError('channel', error);
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

  pushEvent(eventName: string, payload: object): void {
    this.channel.push(`lvm_evt:${eventName}`, payload);
  }

  private emitEvent(event: LiveSocketEventType, payload?: object) {
    this.socket.emitEvent(this.topic, event, payload);
  }

  private emitError(type: LiveSocketErrorType, error?: PhoenixSocketError) {
    this.socket.emitError(this.topic, type, error);
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.emitEvent('lvm-connect', { status: this.status });
  }
}
