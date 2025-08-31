const { Sequelize } = require('sequelize');

const storage = process.env.NODE_ENV === 'test' ? ':memory:' : './database.sqlite';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storage,
  logging: false,
});

module.exports = sequelize;
