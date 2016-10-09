'use strict';

const boom = require('boom');
const bcrypt = require('bcrypt-as-promised');
const express = require('express');
const knex = require('../knex');
const { camelizeKeys, decamelizeKeys } = require('humps');
const jwt = require('jsonwebtoken');

const router = express.Router();

const authorize = function(req, res, next) {
  jwt.verify(req.cookies.token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(boom.create(401, 'Unauthorized'));
    }

    req.token = decoded;

    next();
  });
};

router.get('/favorites/:id', authorize, (req, res, next) => {
  knex('favorites')
    .where('book_id', req.query.bookId)
    .then((favorites) => res.send(favorites.length > 0))
    .catch((err) => next(err));
});

router.get('/favorites', authorize, (req, res, next) => {
  knex('favorites')
    .innerJoin('books', 'books.id', 'favorites.book_id')
    .then((rows) => {
      const favorites = camelizeKeys(rows);
      res.send(favorites);
    })
    .catch((err) => {
      next(err);
    });
});

router.post('/favorites', authorize, (req, res, next) => {
  const { bookId } = req.body;
  const favorite = { bookId, userId: req.token.userId };

  if (!bookId)
    return next(boom.create(400, 'Book id must not be blank'));

  knex('favorites')
    .insert(decamelizeKeys(favorite), '*')
    .then((rows) => {
      favorite.id = rows[0].id;
      res.send(favorite);
    })
    .catch((err) => {
      next(err);
    });
});

router.delete('/favorites', authorize, (req, res, next) => {
  let favorite;
  const id = req.token.userId;

  if (isNaN(id)) return next(boom.create(404, 'Not Found'));
  knex('favorites')
    .where('id', id)
    .first()
    .then((row) => {
      if (!row) throw boom.create(404, 'Not Found');

      favorite = row;

      return knex('favorites')
        .del()
        .where('id', id);
    })
    .then(() => {
      delete favorite.id;
      const jsonFavorite = camelizeKeys(favorite);

      res.send(jsonFavorite);
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
