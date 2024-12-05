const HyperExpress = require('hyper-express');
const Route = new HyperExpress.Router();
 
import HomeController from "../app/controllers/HomeController";
import AuthController from "../app/controllers/AuthController";
import CalculateController from "../app/controllers/CalculateController";

import AuthMiddleware from "../app/middlewares/AuthMiddleware";

Route.get('/', HomeController.index)

//Protected routes
Route.use('/dashboard', AuthMiddleware)
Route.get('/dashboard', HomeController.dashboard)
Route.get('/dashboard/calculate', CalculateController.index)
Route.get('/dashboard/calculate/history', CalculateController.historyPage)

// Route.use('/api', ApiMiddleware)
Route.post('/api/calculate', CalculateController.store)
Route.get('/api/calculations', CalculateController.history)
Route.post('/api/calculations/edit', CalculateController.edit)

Route.get('/register', AuthController.register)
Route.post('/register', AuthController.register)

Route.get('/login', AuthController.login)
Route.post('/login', AuthController.processLogin)

export default Route;