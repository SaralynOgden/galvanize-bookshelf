
'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex');
const { camelizeKeys } = require('humps');
const boom = require('boom');

router.get('/books', (_req, res, next) => {
  knex('books')
    .orderBy('title')
    .then((rows) => {
      const books = camelizeKeys(rows);

      res.send(books);
    })
    .catch((err) => {
      next(err);
    });
});

router.get('/books/:id', (req, res, next) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return next(boom.create(404, 'Not Found'));
  knex('books')
    .where('id', req.params.id)
    .first()
    .then((row) => {
      if (!row) throw boom.create(404, 'Not Found');
      const book = camelizeKeys(row);

      res.send(book);
    })
    .catch((err) => {
      next(err);
    });
});

router.post('/books', (req, res, next) => {
  const title = req.body.title;
  const author = req.body.author;
  const genre = req.body.genre;
  const description = req.body.description;
  const cover_url = req.body.coverUrl;

  if (!title || !title.trim()) {
    return next(boom.create(400, 'Title must not be blank'));
  } else if (!author || !author.trim()) {
    return next(boom.create(400, 'Author must not be blank'));
  } else if (!genre || !genre.trim()) {
    return next(boom.create(400, 'Genre must not be blank'));
  } else if (!description || !description.trim()) {
    return next(boom.create(400, 'Description must not be blank'));
  } else if (!cover_url || !cover_url.trim()){
    return next(boom.create(400, 'Cover URL must not be blank'));
  }
  const row = { title, author, genre, description, cover_url };
  knex('books')
    .insert(row, '*')
    .then((books) => {
      const book = camelizeKeys(row);

      book.id = books[0].id;
      res.send(book);
    })
    .catch((err) => {
      next(err);
    });
});

router.patch('/books/:id', (req, res, next) => {
  const bookUpdate = {
    title: req.body.title,
    author: req.body.author,
    genre: req.body.genre,
    description: req.body.description,
    cover_url: req.body.coverUrl
  };

  if (isNaN(Number(req.params.id))) return next(boom.create(404, 'Not Found'));
  knex('books')
    .where('id', req.params.id)
    .first()
    .then((book) => {
      if (!book) throw boom.create(404, 'Not Found');

      return knex('books')
        .update(bookUpdate, '*')
        .where('id', req.params.id);
    })
    .then((books) => {
      bookUpdate.id = req.params.id;
      const jsonBookUpdate = camelizeKeys(bookUpdate);
      res.send(jsonBookUpdate);
    })
    .catch((err) => {
      next(err);
    });
});

router.delete('/books/:id', (req, res, next) => {
  let book;
  const id = Number(req.params.id);

  if (isNaN(id)) return next();
  knex('books')
    .where('id', id)
    .first()
    .then((row) => {
      if (!row) throw boom.create(404, 'Not Found');

      book = row;

      return knex('books')
        .del()
        .where('id', id);
    })
    .then(() => {
      delete book.id;
      const jsonBook = camelizeKeys(book);
      res.send(jsonBook);
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
