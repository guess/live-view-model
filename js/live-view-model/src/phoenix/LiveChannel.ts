import { Channel } from '@guess/phoenix-js';
import { applyPatch, Operation } from 'json-joy/esm/json-patch';
import { Observable } from 'rxjs';
import { CustomEvent, LiveSocket, SocketError } from './LiveSocket';

export type LiveStateError = {
  /**
   * Describes what type of error occurred.
   */
  type: string;

  /** The original error payload, type depends on error */
  message: string;
};

export type LiveStateChange = {
  /** state version as known by the channel */
  version: number;

  state: Record<string, unknown>;
};

export type LiveStatePatch = {
  /** the version this patch is valid for  */
  version: number;

  /** the json patch to be applied */
  patch: Operation[];
};

export type ChannelOptions = {
  /** The topic for the channel */
  topic: string;

  /** will be sent as params on channel join */
  params?: object;
};

/**
 * This is the lower level API for LiveChannel. It connects to a
 * [live_view_model]() channel over websockets and is responsible
 * for maintaining the state. From the channel it receives `state:change` events which
 * replace the state entirely, or `state:patch` events which contain a json
 * patch to be applied.
 *
 * ## Events
 *
 * ### Dispatching
 * A `CustomEvent` dispatched to LiveChannel will be pushed over the channel as
 * event with the `lvm_evt:` prefix and the detail property will become the payload
 *
 * ### Listeners
 *
 * Events which begin with `livestate-` are assumed to be livestate internal events.
 * The following CustomEvents are supported:
 *
 * | Error             | Detail type             | Description                          |
 * | ----------------- | ----------------------- | ------------------------------------ |
 * | livestate-error   | {@link LiveStateError}  | Occurs on channel or socket errors   |
 * | livestate-change  | {@link LiveStateChange} | on `state:change` from channel       |
 * | livestate-patch   | {@link LiveStatePatch}  | on `state:patch` from channel        |
 * | livestate-connect | none                    | on successful socket or channel join |
 *
 * Will occur on channel or socket errors. The `detail` will consist of
 *
 * And other event name not prefixed with `livestate-` will be assumed to be a channel
 * event and will result in a event being listened to on the channel, which when
 * received, will be dispatched as a CustomEvent of the same name with the payload
 * from the channel event becoming the `detail` property.
 */
export class LiveChannel {
  socket: LiveSocket;
  channel: Channel;
  state: Record<string, unknown> = {};
  stateVersion: number = 0;
  joined: boolean = false;

  constructor(socket: LiveSocket, options: ChannelOptions) {
    this.socket = socket;
    this.channel = socket.channel(options.topic, options.params);
  }

  /** connect to socket and join channel. will do nothing if already connected */
  join(): void {
    if (!this.joined) {
      this.channel.onError((e: SocketError) =>
        this.emitError('channel error', e)
      );
      this.channel
        .join()
        .receive('ok', (resp: object) => {
          console.debug('channel joined', resp);
          this.emit('livestate-connect', { detail: resp });
        })
        .receive('error', (e: SocketError) => {
          this.emitError('channel join error', e);
        });
      this.channel.on('state:change', (state: LiveStateChange) =>
        this.handleChange(state)
      );
      this.channel.on('state:patch', (patch: LiveStatePatch) =>
        this.handlePatch(patch)
      );
      this.channel.on('error', (error: object) => this.emitServerError(error));
      this.joined = true;
    }
  }

  /** leave channel and disconnect from socket */
  leave(): void {
    this.channel?.leave();
    this.joined = false;
  }

  get topic(): string {
    return this.channel.topic;
  }

  /**
   * Returns an Observable for the specified event type.
   * For events that begin with 'livestate-', the event is emitted
   * directly to the Observable. For other events, the event is
   * emitted to the Observable after being received from the channel.
   */
  getEventsForType$(type: string): Observable<CustomEvent> {
    this.listenToChannelEvent(type);
    return this.socket.getEventStream$(this.channel.topic, type);
  }

  /**
   * Sets up a listener for non-livestate events on the channel.
   */
  private listenToChannelEvent(type: string): void {
    if (!type.startsWith('livestate-')) {
      this.channel?.on(type, (payload: object) => {
        this.emit(type, { detail: payload });
      });
    }
  }

  private emit(type: string, event: CustomEvent): void {
    this.socket.emit(this.channel.topic, type, event);
  }

  private emitServerError(error: object): void {
    this.socket.emitServerError(this.channel.topic, error);
  }

  private emitError(type: string, error: SocketError): void {
    this.socket.emitError(this.channel.topic, type, error);
  }

  private handleChange({
    state,
    version,
  }: {
    state: Record<string, unknown>;
    version: number;
  }): void {
    this.state = state;
    this.stateVersion = version;
    this.emit('livestate-change', {
      detail: {
        state: this.state,
        version: this.stateVersion,
      },
    });
  }

  private handlePatch({
    patch,
    version,
  }: {
    patch: Operation[];
    version: number;
  }): void {
    this.emit('livestate-patch', {
      detail: { patch, version },
    });
    if (this.versionMatches(version)) {
      const { doc } = applyPatch(this.state, patch, { mutate: false });
      this.state = doc as Record<string, unknown>;
      this.stateVersion = version;
      this.emit('livestate-change', {
        detail: {
          state: this.state,
          version: this.stateVersion,
        },
      });
    } else {
      this.channel.push('lvm_refresh');
    }
  }

  private versionMatches(version: number): boolean {
    return version === this.stateVersion + 1 || version === 0;
  }

  pushEvent(eventName: string, payload: object): void {
    this.channel.push(`lvm_evt:${eventName}`, payload);
  }
}

export default LiveChannel;
