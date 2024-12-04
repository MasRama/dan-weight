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
class Controller {
    login(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (request.method === "GET") {
                const flash = ((_a = request.session) === null || _a === void 0 ? void 0 : _a.flash) || {};
                return response.inertia("auth/login", { flash });
            }
            try {
                const body = yield request.json();
                const { email, password } = body;
                const user = yield (0, DB_1.default)("users")
                    .where("email", email)
                    .first();
                if (!user) {
                    return response.json({
                        message: "Email not found"
                    }, 400);
                }
                const validPassword = yield bcrypt_1.default.compare(password, user.password);
                if (!validPassword) {
                    return response.json({
                        message: "Invalid password"
                    }, 400);
                }
                // Initialize session if it doesn't exist
                if (!request.session) {
                    request.session = {};
                }
                request.session.user = {
                    id: user.id,
                    email: user.email,
                    name: user.nama,
                    apiKey: user.api_key
                };
                return response.json({
                    message: "Login successful"
                }, 200);
            }
            catch (error) {
                console.log(error);
                return response.json({
                    message: "Server error occurred"
                }, 500);
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
            const body = yield request.json();
            const { name, email, password } = body;
            try {
                const existingUser = yield (0, DB_1.default)("users")
                    .where("email", email)
                    .first();
                if (existingUser) {
                    return response.json({
                        error: "Email already registered"
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
                return response.redirect('/login');
            }
            catch (error) {
                console.log(error);
                return response.json({
                    error: "Server error occurred"
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
