import { connect } from "live-view-model";
import * as xmlhttprequest from "xmlhttprequest";

// Patch globalThis.XMLHttpRequest to emulate browser environment
globalThis.XMLHttpRequest = xmlhttprequest.XMLHttpRequest;

const token = "foobar";
const connection = connect("ws://localhost:4000/lvm", { token });
console.log(connection);
