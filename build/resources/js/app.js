"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const svelte_1 = require("@inertiajs/svelte");
(0, svelte_1.createInertiaApp)({
    resolve: name => Promise.resolve(`${`./Pages/${name}.svelte`}`).then(s => __importStar(require(s))),
    setup({ el, App, props }) {
        new App({ target: el, props });
    },
});
if (location.origin.includes("localhost")) {
    var evtSource = new EventSource('http://localhost:8000/subscribe');
    evtSource.onmessage = function (event) {
        if (event.data.includes("reload")) {
            console.log("reloaded");
            location.reload();
        }
    };
}
