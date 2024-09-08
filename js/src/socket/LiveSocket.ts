import { filter, map, Observable, Subject } from 'rxjs';
import { PhoenixSocket } from '../phoenix/PhoenixSocket.js';
import { LiveSocketEvent } from './LiveSocketEvent.js';
import {
  PhoenixSocketError,
  phoenixSocketErrorKeys,
} from '../phoenix/PhoenixSocketError.js';
import { PhoenixSocketErrorEvent } from '../phoenix/PhoenixSocketErrorEvent.js';
import { PhoenixChannel } from '../phoenix/PhoenixChannel.js';
import { LiveSocketEventType } from './LiveSocketEventType.js';
import { LiveSocketErrorType } from './LiveSocketErrorType.js';
import { ConnectionStatus } from '../connect/ConnectionStatus.js';
import { LiveSocketError } from './LiveSocketError.js';

export class LiveSocket {
  private socket: PhoenixSocket;
  private subject = new Subject<LiveSocketEvent>();
  private status: ConnectionStatus = ConnectionStatus.disconnected;

  constructor(
    public url: string,
    options?: object
  ) {
    this.socket = new PhoenixSocket(url, options);
  }

  connect(): void {
    if (this.status === ConnectionStatus.disconnected) {
      this.setStatus(ConnectionStatus.connecting);
      this.socket.onError((event?: PhoenixSocketErrorEvent) =>
        this.emitError('socket', 'socket', event?.error)
      );
      this.socket.onOpen(() => {
        this.setStatus(ConnectionStatus.connected);
      });
      this.socket.onClose(() => {
        this.setStatus(ConnectionStatus.disconnected);
      });
      this.socket.connect();
    } else {
      console.warn('socket already connected');
    }
  }

  disconnect(): void {
    if (this.status === ConnectionStatus.connected) {
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

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.emitEvent('socket', 'lvm-connect', { status: this.status });
  }
}
