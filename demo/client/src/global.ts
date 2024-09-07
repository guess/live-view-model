import * as xmlhttprequest from "xmlhttprequest";
import WebSocket from "ws";

declare global {
  var XMLHttpRequest: typeof xmlhttprequest.XMLHttpRequest;
  var WebSocket: typeof WebSocket;
}

// Patch XMLHttpRequest to emulate browser environment for longpoll
// Patch WebSocket to emulate browser environment for websockets
globalThis.XMLHttpRequest = xmlhttprequest.XMLHttpRequest;
globalThis.WebSocket = WebSocket as any;
