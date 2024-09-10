import 'reflect-metadata';
import { runInAction } from 'mobx';
import { BehaviorSubject, map, Observable, Subscription } from 'rxjs';
import {
  LiveChannel,
  LiveChannelConnectEvent,
  LiveChannelStatus,
} from './channel.js';
import { LiveConnection } from './connect.js';
import {
  errorStream$,
  eventStream$,
  LiveError,
  LiveEventType,
} from './events.js';
import { LiveState } from './state.js';
import {
  getLiveObservableProperties,
  initializeLiveObservables,
} from './decorators/observable.js';
import { logger } from './utils/logger.js';
import { set } from 'lodash-es';

export type LiveViewModel = {
  topic: string;
  join: (params?: object) => void;
  leave: () => void;
  get channel(): LiveChannel | null;
  connection: LiveConnection;
  liveState: LiveState;
  events$(event: LiveEventType): Observable<object>;
  get errors$(): Observable<LiveError>;
  _subscriptions: Subscription[];
  _errorSubscription: Subscription | null;
  pushEvent: (event: string, payload: object) => void;
  setValueFromPath: <T = unknown>(path: string[], value: T) => T | null;
};

export function liveViewModel(topic: string) {
  // eslint-disable-next-line
  return function <T extends { new (...args: any[]): object }>(constructor: T) {
    return class extends constructor {
      topic = topic;
      connection: LiveConnection;
      liveState: LiveState;

      _channel$ = new BehaviorSubject<LiveChannel | null>(null);
      _subscriptions: Subscription[] = [];
      _errorSubscription: Subscription | null = null;

      // eslint-disable-next-line
      constructor(...args: any[]) {
        super(...args);

        // Find the LiveConnection argument
        const connection = args.find((arg) => arg instanceof LiveConnection);

        if (!connection) {
          throw new Error('LiveConnection not provided to the constructor');
        }

        this.connection = connection!;
        this.liveState = new LiveState(this.connection.stream, topic);
        maybeSubscribeToErrors(this);
        initializeLiveObservables(this);
      }

      events$(event: LiveEventType): Observable<object> {
        return eventStream$(this.connection.stream, topic, event);
      }

      get errors$(): Observable<LiveError> {
        return errorStream$(this.connection.stream, topic);
      }

      get subscriptions() {
        return this._subscriptions || [];
      }

      join = (params?: object) => {
        this.liveState.start();

        subscribeToLiveObservableChanges(this).forEach((subscription) =>
          addSubscription(this, subscription)
        );

        // Refresh if we get out of sync
        subscribeToRefresh(this).forEach((subscription) =>
          addSubscription(this, subscription)
        );

        subscribeToJoinLeave(this).forEach((subscription) =>
          addSubscription(this, subscription)
        );

        // Error subscription
        maybeSubscribeToErrors(this);

        addSubscription(
          this,
          this.connection.createChannel$(topic, params).subscribe({
            next: (channel) => {
              this._channel$.next(channel);
              channel.join();
            },
          })
        );
      };

      leave = () => {
        this.channel?.leave();
        this.liveState.dispose();
        diposeSubscriptions(this);
      };

      pushEvent = (event: string, payload: object) => {
        this.channel?.pushEvent(event, payload);
      };

      get channel(): LiveChannel | null {
        return this._channel$.getValue();
      }

      setValueFromPath = <T = unknown>(path: string[], value: T): T | null => {
        return setFromPath(this, path, value);
      };
    };
  };
}

const subscribeToJoinLeave = (vm: LiveViewModel): Subscription[] => {
  const subscription = vm
    .events$('lvm-connect')
    .pipe(
      map((resp) => resp as LiveChannelConnectEvent),
      map((resp) => resp.status)
    )
    .subscribe((status) => {
      switch (status) {
        case LiveChannelStatus.connected:
          if (vm.constructor.prototype.__onJoinHandler) {
            vm.constructor.prototype.__onJoinHandler.call(this);
          }
          break;

        case LiveChannelStatus.disconnected:
          if (vm.constructor.prototype.__onLeaveHandler) {
            vm.constructor.prototype.__onLeaveHandler.call(this);
          }
          break;

        default:
          break;
      }
    });

  return [subscription];
};

const setFromPath = <T = unknown>(
  vm: LiveViewModel,
  path: string[],
  value: T
): T | null => {
  const topLevelProp = path[0];
  const restOfPath = path.slice(1);
  let finalValue;

  if (!topLevelProp) return null;

  runInAction(() => {
    if (restOfPath.length === 0) {
      // If it's a top-level property, just set it directly
      (vm as Record<string, unknown>)[topLevelProp] = value;
      finalValue = value;
    } else {
      // For nested properties, create a new object
      const currentValue = (vm as Record<string, unknown>)[topLevelProp];
      if (typeof currentValue === 'object') {
        const newValue = { ...currentValue };
        set(newValue, restOfPath, value);
        (vm as Record<string, unknown>)[topLevelProp] = newValue;
        finalValue = newValue;
      }
    }
  });

  return finalValue || null;
};

const addSubscription = (vm: LiveViewModel, subscription: Subscription) => {
  vm._subscriptions.push(subscription);
};

const diposeSubscriptions = (vm: LiveViewModel) => {
  vm._errorSubscription?.unsubscribe();
  vm._subscriptions.forEach((subscription) => subscription.unsubscribe());

  vm._errorSubscription = null;
  vm._subscriptions = [];
};

const maybeSubscribeToErrors = (vm: LiveViewModel) => {
  if (!vm._errorSubscription) {
    vm._errorSubscription = subscribeToErrors(vm);
  }
};

const subscribeToLiveObservableChanges = (
  vm: LiveViewModel
): Subscription[] => {
  const liveObservableProps = getLiveObservableProperties(vm);

  const subscription = vm.liveState.state$.subscribe((payload) => {
    runInAction(() => {
      for (const prop of liveObservableProps) {
        const serverKey = prop.serverKey || prop.propertyKey;
        if (serverKey in payload) {
          logger.log(
            `updating ${prop.propertyKey.toString()} to:`,
            payload[serverKey.toString()]
          );
          // eslint-disable-next-line
          (vm as any)[prop.propertyKey] = payload[serverKey.toString()];
        }
      }
    });
  });

  return [subscription];
};

const subscribeToRefresh = (vm: LiveViewModel): Subscription[] => {
  const subscription = vm.events$('lvm-refresh').subscribe(() => {
    vm.channel?.pushEvent('lvm_refresh');
  });

  return [subscription];
};

const subscribeToErrors = (vm: LiveViewModel): Subscription => {
  return vm.errors$.subscribe({
    next: (error: LiveError) => {
      if (vm.constructor.prototype.__liveErrorHandler) {
        vm.constructor.prototype.__liveErrorHandler.call(this, error);
      }
    },
  });
};

export const join = (vm: unknown, params?: object) =>
  (vm as LiveViewModel).join(params);

export const leave = (vm: unknown) => (vm as LiveViewModel).leave();

export { liveError } from './decorators/error.js';
export { liveEvent } from './decorators/event.js';
export { action } from './decorators/action.js';
export { computed } from './decorators/computed.js';
export { liveObservable, localObservable } from './decorators/observable.js';
export { onJoin, onLeave } from './decorators/join-leave.js';
