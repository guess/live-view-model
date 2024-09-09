import { BehaviorSubject, map, Observable, Subscription } from 'rxjs';
import { Operation, applyPatch } from 'json-joy/lib/json-patch/index.js';
import { eventStream$, LiveEventStream } from './events.js';

export type LiveStateData = {
  state: Record<string, unknown>;
  version: number;
};

export type LiveStateChange = LiveStateData;

export type LiveStatePatch = {
  version: number;
  operations: Operation[];
};

export class LiveState {
  private _data$: BehaviorSubject<LiveStateData>;
  private _patchSubscription: Subscription | null = null;
  private _changeSubscription: Subscription | null = null;

  constructor(
    private stream: LiveEventStream,
    private topic: string,
    initialState: Record<string, unknown> = {},
    initialVersion: number = 0
  ) {
    this._data$ = new BehaviorSubject({
      state: initialState,
      version: initialVersion,
    });

    this.start();
  }

  start() {
    this._changeSubscription = eventStream$(
      this.stream,
      this.topic,
      'lvm-change'
    )
      .pipe(map((event) => event as LiveStateChange))
      .subscribe((event) => this.change(event));

    this._patchSubscription = eventStream$(this.stream, this.topic, 'lvm-patch')
      .pipe(
        map((event) => event as LiveStatePatch),
        map((event) => patch(this.data, event))
      )
      .subscribe((state) => {
        if (state) {
          this.stream.push(this.topic, 'lvm-change', state);
        } else {
          this.stream.push(this.topic, 'lvm-refresh');
        }
      });
  }

  dispose() {
    this._patchSubscription?.unsubscribe();
    this._changeSubscription?.unsubscribe();
  }

  get state$(): Observable<Record<string, unknown>> {
    return this._data$.pipe(map((data) => data.state));
  }

  get version$(): Observable<number> {
    return this._data$.pipe(map((data) => data.version));
  }

  get state(): Record<string, unknown> {
    return this.data.state;
  }

  get data$(): Observable<LiveStateData> {
    return this._data$.asObservable();
  }

  get version(): number {
    return this.data.version;
  }

  get data(): LiveStateData {
    return this._data$.getValue();
  }

  change({ state, version }: LiveStateChange): void {
    this._data$.next({ state, version });
  }
}

export const patch = (
  data: LiveStateData,
  patch: LiveStatePatch
): LiveStateData | null => {
  const { state, version } = data;
  if (versionMatches(patch.version, version)) {
    const { doc } = applyPatch(state, patch.operations, { mutate: false });
    return {
      version: patch.version,
      state: doc as Record<string, unknown>,
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
