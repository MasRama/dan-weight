"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HyperExpress = require('hyper-express');
const Route = new HyperExpress.Router();
const HomeController_1 = __importDefault(require("../app/controllers/HomeController"));
const AuthController_1 = __importDefault(require("../app/controllers/AuthController"));
Route.get('/', HomeController_1.default.index);
Route.get('/dashboard', HomeController_1.default.dashboard);
Route.get('/register', AuthController_1.default.register);
Route.post('/register', AuthController_1.default.register);
Route.get('/login', AuthController_1.default.login);
Route.post('/login', AuthController_1.default.login);
exports.default = Route;
