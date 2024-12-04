"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toast = Toast;
const toastify_js_1 = __importDefault(require("toastify-js"));
function Toast(text, type = "success", duration = 3000) {
    if (type == "success") {
        (0, toastify_js_1.default)({
            text: text,
            duration: duration,
            gravity: "top",
            position: "right",
            style: {
                background: "#00ACEE",
                color: "#FFFFFF",
                boxShadow: "0 4px 6px -1px rgba(0, 172, 238, 0.2)",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "500"
            },
            onClick: function () { }
        }).showToast();
    }
    if (type == "error") {
        (0, toastify_js_1.default)({
            text: text,
            duration: duration,
            gravity: "top",
            position: "right",
            style: {
                background: "#DC2626",
                color: "#FFFFFF",
                boxShadow: "0 4px 6px -1px rgba(220, 38, 38, 0.2)",
                borderRadius: "8px",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: "500"
            },
            onClick: function () { }
        }).showToast();
    }
}
