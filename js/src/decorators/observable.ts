import { observable } from 'mobx';
import { Annotation } from 'mobx/dist/internal.js';
import {
  ClassAccessorDecorator,
  ClassFieldDecorator,
} from 'mobx/dist/types/decorator_fills.js';

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
