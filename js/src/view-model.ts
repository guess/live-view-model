import 'reflect-metadata';
import { runInAction } from 'mobx';
import { BehaviorSubject, map, Observable, Subscription } from 'rxjs';
import {
  LiveChannel,
  LiveChannelConnectEvent,
  LiveChannelEvent,
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
import { parseTopicWithParams } from './utils/topic.js';
import { getLiveEventHandlers } from './decorators/event.js';

export type LiveViewModel = {
  topic: string;
  join: (params?: Record<string, unknown>) => void;
  leave: () => void;
  get channel(): LiveChannel | null;
  connection: LiveConnection;
  liveState?: LiveState;
  events$(event: LiveEventType): Observable<object>;
  get errors$(): Observable<LiveError>;
  addSubscription: (subscription: Subscription) => void;
  _subscriptions: Subscription[];
  _errorSubscription: Subscription | null;
  pushEvent: (event: string, payload: object) => void;
  setValueFromPath: <T = unknown>(path: string[], value: T) => T | null;
};

export function liveViewModel(topicPattern: string) {
  // eslint-disable-next-line
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      readonly topicPattern: string = topicPattern;
      _topic: string = topicPattern;
      connection: LiveConnection;
      liveState?: LiveState;

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
        initializeLiveObservables(this);
      }

      get topic(): string {
        return this._topic;
      }

      events$(event: LiveEventType): Observable<object> {
        return eventStream$(this.connection.stream, this.topic, event);
      }

      get errors$(): Observable<LiveError> {
        return errorStream$(this.connection.stream, this.topic);
      }

      get subscriptions() {
        return this._subscriptions || [];
      }

      join = (params?: Record<string, unknown>) => {
        this._topic = parseTopicWithParams(this.topicPattern, params);
        this.liveState = new LiveState(this.connection.stream, this._topic);
        this.liveState.start();

        maybeSubscribeToErrors(this);
        subscribeToEvents(this);
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
          this.connection.createChannel$(this.topic, params).subscribe({
            next: (channel: LiveChannel) => {
              this._channel$.next(channel);
              channel.join();
            },
          })
        );
      };

      leave = () => {
        this.channel?.leave();
        this.liveState?.dispose();
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

      addSubscription = (subscription: Subscription) => {
        addSubscription(this, subscription);
      };
    };
  };
}

const subscribeToJoinLeave = (vm: LiveViewModel): Subscription[] => {
  const subscription = vm
    .events$('lvm-connect')
    .pipe(
      map((resp: object) => resp as LiveChannelConnectEvent),
      map((resp: LiveChannelConnectEvent) => resp.status)
    )
    .subscribe((status: LiveChannelStatus) => {
      switch (status) {
        case LiveChannelStatus.connected:
          if (vm.constructor.prototype.__onJoinHandler) {
            vm.constructor.prototype.__onJoinHandler.call(vm);
          }
          break;

        case LiveChannelStatus.disconnected:
          if (vm.constructor.prototype.__onLeaveHandler) {
            vm.constructor.prototype.__onLeaveHandler.call(vm);
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
  path: Path,
  value: T
): T | null => {
  const pathArray = pathToArray(path);
  const topLevelProp = pathArray[0];
  const restOfPath = pathArray.slice(1);
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

type Path = string | string[];

const pathToArray = (path: Path): string[] => {
  if (Array.isArray(path)) {
    return path;
  } else if (typeof path === 'string') {
    return path.split('/').filter((s) => !!s);
  } else {
    // TODO: Should we throw instead?
    return [];
  }
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

  if (!vm.liveState) {
    throw new Error('Must join channel before subscribing to changes');
  }

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
        vm.constructor.prototype.__liveErrorHandler.call(vm, error);
      }
    },
  });
};

const subscribeToEvents = (vm: LiveViewModel): Subscription => {
  return vm
    .events$('lvm-event')
    .pipe(map((e: object) => e as LiveChannelEvent))
    .subscribe({
      next: (event: LiveChannelEvent) => {
        if (vm.constructor.prototype.__liveEventHandlers) {
          const eventHandlers = getLiveEventHandlers(vm);
          const eventHandler = eventHandlers.find((h) => h.name === event.name);
          if (eventHandler) {
            eventHandler.handler.call(vm, event.detail);
          }
        }
      },
    });
};

export const join = (vm: unknown, params?: Record<string, unknown>) =>
  (vm as LiveViewModel).join(params);

export const leave = (vm: unknown) => (vm as LiveViewModel).leave();

export { liveError } from './decorators/error.js';
export { liveEvent, handleEvent } from './decorators/event.js';
export { action } from './decorators/action.js';
export { computed } from './decorators/computed.js';
export { liveObservable, localObservable } from './decorators/observable.js';
export { onJoin, onLeave } from './decorators/join-leave.js';
