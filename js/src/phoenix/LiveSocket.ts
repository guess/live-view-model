import { Channel, Socket } from '@guess/phoenix-js';
import { BehaviorSubject, filter, map, Observable, Subject } from 'rxjs';

export type CustomEvent = { name?: string; detail?: object };
export type LiveSocketEvent = {
  topic: string;
  type: string;
  event: CustomEvent;
};
export type SocketError =
  | { reason: string; name: string; message: string }
  | string;

export class LiveSocket {
  topic: string;
  socket: Socket;
  private subject = new Subject<LiveSocketEvent>();
  private connected$ = new BehaviorSubject<boolean>(false);

  constructor(url: string, options?: object) {
    this.topic = url;
    this.socket = new Socket(url, options);
  }

  connect() {
    if (!this.isConnected) {
      this.socket.onError((error: SocketError) =>
        this.emitError(this.topic, 'socket error', error)
      );
      this.socket.onOpen((resp?: CustomEvent) => {
        this.emit(this.topic, 'livestate-connect', resp);
      });
      this.socket.connect();
      this.connected$.next(true);
    }
  }

  disconnect() {
    this.socket.disconnect();
    this.connected$.next(false);
  }

  get isConnected(): boolean {
    return this.connected$.getValue();
  }

  channel(topic: string, params?: object): Channel {
    return this.socket.channel(topic, params);
  }

  emit(topic: string, type: string, customEvent?: CustomEvent) {
    const event = customEvent || {};
    this.subject.next({ topic, type, event });
  }

  emitServerError(topic: string, error: object) {
    this.emit(topic, 'livestate-error', { detail: error });
  }

  emitError(topic: string, type: string, error: SocketError): void {
    this.emit(topic, 'livestate-error', {
      detail: {
        type,
        message: this.extractMessage(error),
      },
    });
  }

  private extractMessage(error: SocketError): string {
    if (error && typeof error === 'object') {
      const message = [error.reason, error.name, error.message].find(
        (value) => value
      );
      console.debug(message);
      return message || 'Unknown error';
    } else if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error';
  }

  getEventStream$(topic: string, type: string): Observable<CustomEvent> {
    return this.subject.asObservable().pipe(
      filter((event: LiveSocketEvent) => event.topic === topic),
      filter((event: LiveSocketEvent) => event.type === type),
      map((event: LiveSocketEvent) => event.event)
    );
  }
}
