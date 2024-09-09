import { logger } from '../utils/logger.js';
import { LiveViewModel } from '../view-model.js';

export function liveEvent(eventName: string) {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    // eslint-disable-next-line
    descriptor.value = function (this: LiveViewModel, ...args: any[]) {
      const payload = originalMethod.apply(this, args);
      if (this.channel) {
        logger.debug(`pushEvent: ${eventName}`, payload);
        this.pushEvent(eventName, payload);
      } else {
        this.connection.emitError(this.topic, 'channel', {
          message: `Cannot send event "${eventName}": channel not initialized`,
        });
      }
      return payload;
    };
    return descriptor;
  };
}
