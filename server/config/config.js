
console.log('Carregando config.js...');
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000
};