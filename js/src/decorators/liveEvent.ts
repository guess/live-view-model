import { LiveViewModel } from 'src/LiveViewModel.js';

export function liveEvent(eventName: string) {
  return function (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (this: LiveViewModel, ...args: any[]) {
      const payload = originalMethod.apply(this, args);
      if (this.channel) {
        console.debug(`pushEvent: ${eventName}`, payload);
        this.channel.pushEvent(eventName, payload);
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
