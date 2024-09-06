import * as xmlhttprequest from "xmlhttprequest";
import WebSocket from "ws";

// Patch XMLHttpRequest to emulate browser environment for longpoll
globalThis.XMLHttpRequest = xmlhttprequest.XMLHttpRequest;

// Patch WebSocket to emulate browser environment for websockets
global.WebSocket = WebSocket;
