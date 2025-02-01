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
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
class Controller {
    login(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const flash = ((_a = request.session) === null || _a === void 0 ? void 0 : _a.flash) || {};
            return response.inertia("auth/login", { flash });
        });
    }
    processLogin(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const body = yield request.json();
                const { email, password } = body;
                const user = yield DB_1.default.from('users')
                    .where('email', email)
                    .first();
                if (!user || !(yield bcrypt_1.default.compare(password, user.password))) {
                    return response.status(401).json({
                        error: 'Invalid credentials'
                    });
                }
                // Delete existing sessions for this user
                yield (0, DB_1.default)('sessions')
                    .where('user_id', user.id)
                    .delete();
                // Create new session
                const sessionId = (0, uuid_1.v4)();
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7);
                yield (0, DB_1.default)('sessions').insert({
                    id: sessionId,
                    user_id: user.id,
                    token: (0, uuid_1.v4)(),
                    expires_at: expiresAt.toISOString()
                });
                response.cookie('auth_id', sessionId, {
                    httpOnly: true,
                    secure: process.env.DB_CONNECTION === 'production',
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                    path: '/'
                });
                return response.json({
                    message: 'Login successful'
                });
            }
            catch (error) {
                console.log(error);
                return response.status(500).json({
                    error: 'Server error'
                });
            }
        });
    }
    logout(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    register(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (request.method === "GET") {
                return response.inertia("auth/register");
            }
            try {
                const body = yield request.json();
                const { name, email, password } = body;
                const existingUser = yield (0, DB_1.default)("users")
                    .where("email", email)
                    .first();
                if (existingUser) {
                    return response.json({
                        message: "Email is already registered"
                    }, 400);
                }
                const salt = yield bcrypt_1.default.genSalt(10);
                const hashedPassword = yield bcrypt_1.default.hash(password, salt);
                const apiKey = crypto_1.default.randomBytes(32).toString('hex');
                yield (0, DB_1.default)("users").insert({
                    nama: name,
                    email: email,
                    password: hashedPassword,
                    api_key: apiKey
                });
                return response.json({
                    message: "Registration successful"
                }, 200);
            }
            catch (error) {
                console.error(error);
                return response.json({
                    message: "Server error occurred"
                }, 500);
            }
        });
    }
    show(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    edit(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    update(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    destroy(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
exports.default = new Controller();
