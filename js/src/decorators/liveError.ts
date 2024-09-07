import { PhoenixSocketError } from '../index.js';

export function liveError() {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    // Store the error handler on the prototype
    target.constructor.prototype.__liveErrorHandler = function (
      error: PhoenixSocketError
    ) {
      originalMethod.call(this, error);
    };

    return descriptor;
  };
}
