import {
  PhoenixChannel,
  PhoenixChannelError,
  PhoenixSocketError,
  PhoenixSocketErrorEvent,
} from './phoenix.js';
import {
  LiveSocket,
  LiveSocketErrorType,
  LiveSocketEventType,
} from './socket.js';
import { LiveStateChange, LiveStatePatch } from './state.js';

export enum LiveChannelStatus {
  disconnected = 'disconnected',
  connecting = 'connecting',
  connected = 'connected',
}

export type LiveChannelParams = {
  topic: string;
  params?: object;
};

export type LiveChannelEvent = {
  name: string;
  detail?: object;
};

export class LiveChannel {
  private channel: PhoenixChannel;
  private status: LiveChannelStatus = LiveChannelStatus.disconnected;

  constructor(
    private socket: LiveSocket,
    params: LiveChannelParams
  ) {
    this.channel = socket.channel(params.topic, params.params);
  }

  /** connect to socket and join channel. will do nothing if already connected */
  join(): void {
    if (this.status === LiveChannelStatus.disconnected) {
      this.setStatus(LiveChannelStatus.connecting);
      this.channel.onError((event?: PhoenixSocketErrorEvent) => {
        // console.log('channel error', event);
        this.emitError('channel', event?.error);
      });
      this.channel
        .join()
        .receive('ok', () => {
          this.setStatus(LiveChannelStatus.connected);
        })
        .receive('error', (error: PhoenixChannelError) => {
          this.emitError('channel', error);
        });
      this.channel.on('state:change', (state: LiveStateChange) => {
        this.emitEvent('lvm-change', state);
      });
      this.channel.on('state:patch', (patch: LiveStatePatch) => {
        this.emitEvent('lvm-patch', patch);
      });
      this.channel.on('error', (event: PhoenixSocketErrorEvent) => {
        console.debug('TODO: server error', event);
        this.emitError('server', event.error);
      });
      this.channel.onClose(() => {
        this.setStatus(LiveChannelStatus.disconnected);
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

  private setStatus(status: LiveChannelStatus): void {
    this.status = status;
    this.emitEvent('lvm-connect', { status: this.status });
  }
}
