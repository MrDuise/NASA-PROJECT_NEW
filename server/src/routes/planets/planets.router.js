const express = require('express');



const { httpGetALLPlanets, } = require('./planets.controller');

const planetsRouter = express.Router();

planetsRouter.get('/', httpGetALLPlanets);

module.exports = planetsRouter;