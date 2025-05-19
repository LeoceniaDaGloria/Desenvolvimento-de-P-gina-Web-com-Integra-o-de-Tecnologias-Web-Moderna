
console.log('Carregando apiRoutes.js...');
const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

router.post('/contato', apiController.contato);

module.exports = router;