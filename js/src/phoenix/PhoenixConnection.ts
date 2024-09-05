import {
  BehaviorSubject,
  filter,
  map,
  Observable,
  of,
  Subscription,
  switchMap,
  zip,
} from 'rxjs';
import LiveChannel from './LiveChannel';
import { isNotNull } from '../utils/rxjs';
import { LiveSocket } from './LiveSocket';

export class PhoenixConnection {
  private url: string;
  private _subscription?: Subscription;
  private _socket$ = new BehaviorSubject<LiveSocket | null>(null);
  private _params$: BehaviorSubject<object | null>;

  constructor(url: string, params?: object) {
    this.url = url;
    this._params$ = new BehaviorSubject(params || null);
  }

  updateParams(params: object) {
    this._params$.next(params);
  }

  connect() {
    console.debug('connecting to socket');
    this._subscription = buildSocket(this.url, this._params$).subscribe(
      (socket) => {
        console.debug('connected to socket');
        this._socket$.next(socket);
      }
    );
  }

  disconnect() {
    console.debug('disconnecting from socket');
    this.socket?.disconnect();
    this._subscription?.unsubscribe();
  }

  createChannel$(topic: string, params?: object): Observable<LiveChannel> {
    return this._socket$.pipe(
      filter(isNotNull),
      map((socket) => new LiveChannel(socket, { topic, params }))
    );
  }

  get socket(): LiveSocket | null {
    return this._socket$.value;
  }

  get socket$(): Observable<LiveSocket> {
    return this._socket$.asObservable().pipe(filter(isNotNull));
  }
}

const buildSocket = (
  url: string,
  params$: Observable<object | null>
): Observable<LiveSocket> => {
  return params$.pipe(
    map((params) => {
      const socket = new LiveSocket(url, {
        params: params || {},
        debugger: (kind: string, msg: string, data: unknown) => {
          console.debug(`${kind}: ${msg}`, data);
        },
      });
      socket.connect();
      return socket;
    }),
    switchMap((socket) => {
      return zip(
        of(socket),
        socket.getEventStream$(socket.topic, 'livestate-connect')
      );
    }),
    // eslint-disable-next-line
    map(([socket, _isConnected]) => socket)
  );
};
