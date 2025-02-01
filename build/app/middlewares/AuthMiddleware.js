"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const DB_1 = __importDefault(require("../services/DB"));
exports.default = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (request.cookies.auth_id) {
            const session = yield DB_1.default.from("sessions")
                .where("id", request.cookies.auth_id)
                .where("expires_at", ">", DB_1.default.raw('CURRENT_TIMESTAMP'))
                .first();
            if (session) {
                const user = yield DB_1.default.from("users")
                    .where("id", session.user_id)
                    .select([
                    "id",
                    "nama",
                    "email",
                    "api_key"
                ])
                    .first();
                // If we're trying to access login/register pages with valid session
                if (request.path === '/login' || request.path === '/register') {
                    response.redirect('/dashboard');
                    return false;
                }
                request.user = user;
                request.share = {
                    "user": request.user
                };
                return true;
            }
        }
        response.clearCookie("auth_id", { path: '/' });
        response.redirect("/login");
        return false;
    }
    catch (error) {
        console.log('Auth error:', error);
        response.clearCookie("auth_id", { path: '/' });
        response.redirect("/login");
        return false;
    }
});
