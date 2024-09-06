import { filter, map, Observable, Subject } from 'rxjs';
import { PhoenixSocket } from './PhoenixSocket.js';
import { LiveSocketEvent } from './LiveSocketEvent.js';
import { PhoenixSocketError } from './PhoenixSocketError.js';
import { PhoenixChannel } from '../channel/PhoenixChannel.js';
import { LiveSocketEventType } from './LiveSocketEventType.js';
import { LiveSocketErrorType } from './LiveSocketErrorType.js';

export class LiveSocket {
  private socket: PhoenixSocket;
  private subject = new Subject<LiveSocketEvent>();
  private isConnected: boolean = false;

  constructor(
    public url: string,
    options?: object
  ) {
    this.socket = new PhoenixSocket(url, options);
  }

  connect(): void {
    if (!this.isConnected) {
      this.socket.onError((error: PhoenixSocketError) =>
        this.emitError(this.url, 'socket', error)
      );
      this.socket.onOpen(() => this.emitEvent(this.url, 'lvm-connect'));
      this.socket.connect();
      this.isConnected = true;
    }
  }

  disconnect(): void {
    this.socket.disconnect();
    this.isConnected = false;
  }

  channel(topic: string, params?: object): PhoenixChannel {
    return this.socket.channel(topic, params);
  }

  emitEvent(topic: string, event: LiveSocketEventType, payload?: object): void {
    console.log(`event: ${event} from topic: ${topic}`, payload);
    this.subject.next({ topic, event, payload });
  }

  emitError(
    topic: string,
    type: LiveSocketErrorType,
    error: PhoenixSocketError
  ): void {
    // console.error(`error: ${type} error from topic: ${topic}`, error);
    this.emitEvent(topic, 'lvm-error', {
      type,
      message: error.message || error.reason || 'Unknown error',
    });
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
}
