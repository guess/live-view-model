import { BehaviorSubject, map, Observable, Subscription } from 'rxjs';
import { Operation, applyPatch } from 'json-joy/lib/json-patch/index.js';
import { eventStream$, LiveEventStream } from './events.js';

export type LiveStateData = {
  data: Record<string, unknown>;
  version: number;
};

export type LiveStateChange = LiveStateData;

export type LiveStatePatch = {
  version: number;
  operations: Operation[];
};

export class LiveState {
  private _state$: BehaviorSubject<LiveStateData>;
  private _patchSubscription: Subscription | null = null;
  private _changeSubscription: Subscription | null = null;

  constructor(
    private stream: LiveEventStream,
    private topic: string,
    initialState: Record<string, unknown> = {},
    initialVersion: number = 0
  ) {
    this._state$ = new BehaviorSubject({
      data: initialState,
      version: initialVersion,
    });

    this.start();
  }

  start() {
    if (this.isDisposed()) {
      this._changeSubscription = eventStream$(
        this.stream,
        this.topic,
        'lvm-change'
      )
        .pipe(map((event) => event as LiveStateChange))
        .subscribe((event) => this.change(event));

      this._patchSubscription = eventStream$(
        this.stream,
        this.topic,
        'lvm-patch'
      )
        .pipe(
          map((event) => event as LiveStatePatch),
          map((event) => patch(this.state, event))
        )
        .subscribe((state) => {
          if (state) {
            this.stream.push(this.topic, 'lvm-change', state);
          } else {
            this.stream.push(this.topic, 'lvm-refresh', this.state);
          }
        });
    }
  }

  dispose() {
    this._patchSubscription?.unsubscribe();
    this._changeSubscription?.unsubscribe();
    this._patchSubscription = null;
    this._changeSubscription = null;
  }

  private isDisposed() {
    return !this._changeSubscription && !this._patchSubscription;
  }

  get data$(): Observable<Record<string, unknown>> {
    return this._state$.pipe(map((state) => state.data));
  }

  get version$(): Observable<number> {
    return this._state$.pipe(map((data) => data.version));
  }

  get data(): Record<string, unknown> {
    return this.state.data;
  }

  get state$(): Observable<LiveStateData> {
    return this._state$.asObservable();
  }

  get version(): number {
    return this.state.version;
  }

  get state(): LiveStateData {
    return this._state$.getValue();
  }

  private change({ data, version }: LiveStateChange): void {
    this._state$.next({ data, version });
  }
}

export const patch = (
  state: LiveStateData,
  patch: LiveStatePatch
): LiveStateData | null => {
  const { data, version } = state;
  if (versionMatches(patch.version, version)) {
    const { doc } = applyPatch(data, patch.operations, { mutate: false });
    return {
      version: patch.version,
      data: doc as Record<string, unknown>,
    };
  } else {
    return null;
  }
};

const versionMatches = (
  newVersion: number,
  currentVersion: number
): boolean => {
  return newVersion === currentVersion + 1 || newVersion === 0;
};
