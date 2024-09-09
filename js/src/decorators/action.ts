import { runInAction } from 'mobx';

export function action() {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    // eslint-disable-next-line
    descriptor.value = function (...args: any[]) {
      return runInAction(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}
