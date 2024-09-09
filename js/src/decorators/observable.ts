import { observable, makeObservable } from 'mobx';
import { Annotation } from 'mobx/dist/internal.js';
import {
  ClassAccessorDecorator,
  ClassFieldDecorator,
} from 'mobx/dist/types/decorator_fills.js';

const LIVE_OBSERVABLE_METADATA_KEY = Symbol('liveObservable');
const LOCAL_OBSERVABLE_METADATA_KEY = Symbol('localObservable');

export type ObservableType = Annotation &
  PropertyDecorator &
  ClassAccessorDecorator &
  ClassFieldDecorator;

export interface ObservableDecoratorMetadata {
  propertyKey: string | symbol;
  observableType: ObservableType;
  serverKey?: string;
}

export interface ObservableDecorator {
  (serverKey?: string): PropertyDecorator;
  ref: (serverKey?: string) => PropertyDecorator;
  deep: (serverKey?: string) => PropertyDecorator;
  shallow: (serverKey?: string) => PropertyDecorator;
  struct: (serverKey?: string) => PropertyDecorator;
}

export function createObservableDecorator(
  metadataKey: symbol,
  defaultObservableType: ObservableType = observable
): ObservableDecorator {
  const createDecorator =
    (observableType: ObservableType = defaultObservableType) =>
    (serverKey?: string): PropertyDecorator =>
    (target: object, propertyKey: string | symbol): void => {
      const metadata: ObservableDecoratorMetadata = {
        propertyKey,
        observableType,
        serverKey: serverKey || propertyKey.toString(),
      };

      const existingMetadata: ObservableDecoratorMetadata[] =
        Reflect.getMetadata(metadataKey, target.constructor) || [];
      existingMetadata.push(metadata);
      Reflect.defineMetadata(metadataKey, existingMetadata, target.constructor);

      // Define a getter/setter for the property
      let value: unknown;
      Object.defineProperty(target, propertyKey, {
        get() {
          return value;
        },
        set(newValue) {
          value = newValue;
        },
        enumerable: true,
        configurable: true,
      });
    };

  const decorator: ObservableDecorator = Object.assign(createDecorator(), {
    ref: createDecorator(observable.ref),
    deep: createDecorator(observable.deep),
    shallow: createDecorator(observable.shallow),
    struct: createDecorator(observable.struct),
  });

  return decorator;
}

export const liveObservable = createObservableDecorator(
  LIVE_OBSERVABLE_METADATA_KEY
);
export const localObservable = createObservableDecorator(
  LOCAL_OBSERVABLE_METADATA_KEY
);

// eslint-disable-next-line
export function initializeLiveObservables(instance: any) {
  // eslint-disable-next-line
  const observables: Record<string | symbol, any> = {};
  const liveMetadata = getLiveObservableProperties(instance);
  const localMetadata = getLocalObservableProperties(instance);

  [...liveMetadata, ...localMetadata].forEach(
    ({ propertyKey, observableType }) => {
      observables[propertyKey] = observableType;
    }
  );

  makeObservable(instance, observables);
}

// Utility function to get all live observable properties for a class
export function getLiveObservableProperties(
  target: object
): ObservableDecoratorMetadata[] {
  return (
    Reflect.getMetadata(LIVE_OBSERVABLE_METADATA_KEY, target.constructor) || []
  );
}

export function getLocalObservableProperties(
  target: object
): ObservableDecoratorMetadata[] {
  return (
    Reflect.getMetadata(LOCAL_OBSERVABLE_METADATA_KEY, target.constructor) || []
  );
}
