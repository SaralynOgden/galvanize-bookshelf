'use strict';

const express = require('express');
const router = express.Router(); // eslint-disable-line new-cap
const knex = require('../knex');
const bcrypt = require('bcrypt-as-promised');
const { decamelizeKeys } = require('humps');
const boom = require('boom');

router.post('/users', (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  if (!email || !email.trim()) {
    return next(boom.create(400, 'Email must not be blank'));
  }
  if (!password || password.length < 8) {
    return next(boom.create(
      400, 'Password must be at least 8 characters long'));
  }
  knex('users')
    .where('email', email)
    .then((user) => {
      if (user.length !== 0) {
        return next(boom.create(400, 'Email already exists'));
      }
    });

  let newUser;

  bcrypt.hash(password, 12)
    .then((hashedPassword) => {
      newUser = { firstName, lastName, email, hashedPassword };

      return knex('users').insert(decamelizeKeys(newUser), '*');
    })
    .then((users) => {
      newUser.id = users[0].id;

      delete newUser.hashedPassword;
      res.send(newUser);
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
