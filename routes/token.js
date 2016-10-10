'use strict';

const boom = require('boom');
const bcrypt = require('bcrypt-as-promised');
const express = require('express');
const knex = require('../knex');
const jwt = require('jsonwebtoken');
const { camelizeKeys } = require('humps');
const router = express.Router(); // eslint-disable-line new-cap

const authorize = function(req, res) {
  jwt.verify(req.cookies.token, process.env.JWT_SECRET, (err) => {
    res.verify = err === null;
  });
};

router.get('/token', authorize, (req, res) => {
  res.send(res.verify);
});

router.post('/token', (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.trim()) {
    return next(boom.create(400, 'Email must not be blank'));
  }
  if (!password || password.length < 8) {
    return next(boom.create(
      400, 'Password must be at least 8 characters long'));
  }
  let user;

  knex('users')
    .where('email', email)
    .first()
    .then((row) => {
      if (!row) { throw boom.create(400, 'Bad email or password'); }

      user = camelizeKeys(row);

      return bcrypt.compare(password, user.hashedPassword);
    })
    .then(() => {
      delete user.hashedPassword;

      const expiry = new Date(Date.now() + 1000 * 60 * 60 * 3); // 3 hours
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: '3h'
      });

      res.cookie('token', token, {
        httpOnly: true,
        expires: expiry,
        secure: router.get('env') === 'production'
      });

      res.send(user);
    })
    .catch(bcrypt.MISMATCH_ERROR, () => {
      throw boom.create(400, 'Bad email or password');
    })
    .catch((err) => {
      next(err);
    });
});

router.delete('/token', (req, res) => {
  res.clearCookie('token');
  res.status(200);
  res.send(true);
});

module.exports = router;
