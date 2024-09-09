import { BehaviorSubject, map, Observable } from 'rxjs';
import { Operation, applyPatch } from 'json-joy/lib/json-patch/index.js';

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

  constructor(
    initialState: Record<string, unknown> = {},
    initialVersion: number = 0
  ) {
    this._data$ = new BehaviorSubject({
      state: initialState,
      version: initialVersion,
    });
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
