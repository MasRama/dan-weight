"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HyperExpress = require('hyper-express');
const Route = new HyperExpress.Router();
const HomeController_1 = __importDefault(require("../app/controllers/HomeController"));
const AuthController_1 = __importDefault(require("../app/controllers/AuthController"));
const CalculateController_1 = __importDefault(require("../app/controllers/CalculateController"));
const AuthMiddleware_1 = __importDefault(require("../app/middlewares/AuthMiddleware"));
Route.get('/', HomeController_1.default.index);
//Protected routes
Route.use('/dashboard', AuthMiddleware_1.default);
Route.get('/dashboard', HomeController_1.default.dashboard);
Route.get('/dashboard/calculate', CalculateController_1.default.index);
Route.get('/dashboard/calculate/history', CalculateController_1.default.historyPage);
Route.post('/api/calculate', CalculateController_1.default.store);
Route.get('/api/calculations', CalculateController_1.default.history);
Route.post('/api/calculations/edit', CalculateController_1.default.edit);
Route.delete('/api/calculate/all', CalculateController_1.default.destroyAll);
Route.get('/register', AuthController_1.default.register);
Route.post('/register', AuthController_1.default.register);
Route.get('/login', AuthController_1.default.login);
Route.post('/login', AuthController_1.default.processLogin);
exports.default = Route;
