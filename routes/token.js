'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex');
const { camelizeKeys } = require('humps');
const boom = require('boom');

router.post('/token', (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.trim())
    return next(boom.create(400, 'Email must not be blank'));

  if (!password || password.length < 8)
    return next(boom.create
      (400, 'Password must be at least 8 characters long'));

  let user;

  knex('users')
    .where('email', email)
    .first()
    .then((row) => {
      if (!row) throw boom.create(400, 'Bad email or password')

      user = camelizeKeys(row);

      return bcrypt.compare(password, user.hashedPassword);
    })
    .then((comparison) => {
      
    })
});

router.delete('/token/:id', (req, res, next) => {
  let token;
  const id = Number(req.params.id);

  if (isNaN(id)) return next();
  knex('token')
    .where('id', id)
    .first()
    .then((row) => {
      if (!row) throw boom.create(404, 'Not Found');

      token = row;

      return knex('token')
        .del()
        .where('id', id);
    })
    .then(() => {
      delete token.id;
      delete password
      convertToCamelCase(token);
      res.send(token);
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
