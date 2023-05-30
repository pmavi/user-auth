const express = require('express');

const routes = express.Router();

const AuthController = require('./controllers/UserController')

const Authorize = require('../middleware/Authorize')

routes.post('/api/register',AuthController.Signup)
routes.post('/api/login',AuthController.Login)
routes.get('/register',AuthController.Signup)
routes.get('/login',AuthController.Login)



module.exports = routes;
