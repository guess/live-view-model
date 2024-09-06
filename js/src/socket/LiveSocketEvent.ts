import { LiveSocketEventType } from './LiveSocketEventType.js';

export type LiveSocketEvent = {
  topic: string;
  event: LiveSocketEventType;
  payload?: object;
};
