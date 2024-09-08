import { Socket as PhoenixSocket } from '@guess/phoenix-js';
import { Channel as PhoenixChannel } from '@guess/phoenix-js';
import {
  PhoenixSocketError,
  PhoenixSocketErrorEvent,
  phoenixSocketErrorKeys,
} from './phoenix.js';
import { filter, map, Observable, Subject } from 'rxjs';

// externally exposed errors
export type LiveSocketError = {
  type: string;
  message: string;
  code?: string;
  error?: object;
};

export type LiveSocketErrorType = 'socket' | 'channel' | 'server';

export type LiveSocketEvent = {
  topic: string;
  event: LiveSocketEventType;
  payload?: object;
};

export type LiveSocketEventType =
  | 'lvm-connect'
  | 'lvm-error'
  | 'lvm-patch'
  | 'lvm-change'
  | 'lvm-event';

export enum LiveSocketStatus {
  disconnected = 'disconnected',
  connecting = 'connecting',
  connected = 'connected',
}

export class LiveSocket {
  private socket: PhoenixSocket;
  private subject = new Subject<LiveSocketEvent>();
  private status: LiveSocketStatus = LiveSocketStatus.disconnected;

  constructor(
    public url: string,
    options?: object
  ) {
    this.socket = new PhoenixSocket(url, options);
  }

  connect(): void {
    if (this.status === LiveSocketStatus.disconnected) {
      this.setStatus(LiveSocketStatus.connecting);
      this.socket.onError((event?: PhoenixSocketErrorEvent) =>
        this.emitError('socket', 'socket', event?.error)
      );
      this.socket.onOpen(() => {
        this.setStatus(LiveSocketStatus.connected);
      });
      this.socket.onClose(() => {
        this.setStatus(LiveSocketStatus.disconnected);
      });
      this.socket.connect();
    } else {
      console.warn('socket already connected');
    }
  }

  disconnect(): void {
    if (this.status === LiveSocketStatus.connected) {
      this.socket.disconnect();
    } else {
      console.warn('socket not connected');
    }
  }

  channel(topic: string, params?: object): PhoenixChannel {
    return this.socket.channel(topic, params);
  }

  emitEvent(topic: string, event: LiveSocketEventType, payload?: object): void {
    if (event !== 'lvm-error') {
      console.log(`event: ${event} from topic: ${topic}`, payload);
    }
    this.subject.next({ topic, event, payload });
  }

  emitError(
    topic: string,
    type: LiveSocketErrorType,
    error?: Partial<PhoenixSocketError>
  ): void {
    const event: LiveSocketError = {
      type,
      message: error?.message || error?.reason || 'Unknown error',
    };
    if (error?.code) {
      event.code = error.code;
    }
    if (
      error &&
      Object.keys(error).some((key) => !phoenixSocketErrorKeys.includes(key))
    ) {
      event.error = error;
    }
    console.log(`error: ${type} error from topic: ${topic}`, event.message);
    this.emitEvent(topic, 'lvm-error', event);
  }

  getEventStream$(
    topic: string,
    event: LiveSocketEventType
  ): Observable<object> {
    return this.subject.asObservable().pipe(
      filter((e: LiveSocketEvent) => e.topic === topic),
      filter((e: LiveSocketEvent) => e.event === event),
      map((e: LiveSocketEvent) => e.payload || {})
    );
  }

  getErrorStream$(topic: string): Observable<LiveSocketError> {
    return this.subject.asObservable().pipe(
      filter((e: LiveSocketEvent) => e.topic === topic || e.topic === 'socket'),
      filter((e: LiveSocketEvent) => e.event === 'lvm-error'),
      map((e: LiveSocketEvent) => e.payload as LiveSocketError)
    );
  }

  private setStatus(status: LiveSocketStatus): void {
    this.status = status;
    this.emitEvent('socket', 'lvm-connect', { status: this.status });
  }
}
