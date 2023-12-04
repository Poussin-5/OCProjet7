const Book = require('../models/book')
const sharp = require('sharp')
const fs = require('fs')

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books)
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      })
    })
}

exports.getOneBook = (req, res, next) => {
  Book.findOne({
    _id: req.params.id,
  })
    .then((book) => {
      res.status(200).json(book)
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      })
    })
}

exports.getBestBooks = (req, res, next) => {
  Book.find()
    .then((bestBooks) => {
      bestBooks.sort((a, b) => b.averageRating - a.averageRating)
      if (bestBooks.length > 3) {
        bestBooks.length = 3
      }
      res.status(200).json(bestBooks)
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      })
    })
}

exports.createBook = async (req, res, next) => {
  if (req.file) {
    const filetypes = /jpeg|jpg|png|gif/
    const isValid = filetypes.test(req.file.mimetype)
    if (!isValid) {
      return res.status(400).json({ message: "ceci n'est pas une image" })
    }
    let compressName = `images/compress_${req.file.filename}`
    await sharp(req.file.path)
      .resize({ heigth: 200, width: 200 })
      .toFile(compressName)
  } else {
    return res.status(400).json({ message: "il n'y a pas d'image" })
  }

  const bookObject = JSON.parse(req.body.book)
  delete bookObject._id
  delete bookObject._userId

  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/${compressName}`,
  })

  book
    .save()
    .then(() => {
      res.status(201).json({ message: 'Objet enregistré !' })
    })
    .catch((error) => {
      res.status(400).json({ error })
    })

  fs.unlink(req.file.path, (err) => {
    if (err) {
      console.error(err)
    } else {
      // Suppression réussie !
    }
  })
}

exports.modifyBook = async (req, res, next) => {
  if (req.file) {
    const filetypes = /jpeg|jpg|png|gif/
    const isValid = filetypes.test(req.file.mimetype)
    if (!isValid) {
      return res.status(400).json({ message: "ceci n'est pas une image" })
    }
    let compressName = `images/compress_${req.file.filename}`
    await sharp(req.file.path)
      .resize({ heigth: 200, width: 200 })
      .toFile(compressName)
  }

  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/compress_${
          req.file.filename
        }`,
      }
    : { ...req.body }

  delete bookObject._userId
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(403).json({ message: 'Not authorized' })
      } else {
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: 'Objet modifié!' }))
          .catch((error) => res.status(401).json({ error }))
        if (req.file) {
          fs.unlink(`images/${req.file.filename}`, (err) => {
            if (err) {
              console.error(err)
            }
          })
        }
      }
    })
    .catch((error) => {
      res.status(400).json({ error })
    })
}

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(403).json({ message: 'Not authorized' })
      } else {
        const filename = book.imageUrl.split('/images/')[1]
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: 'Objet supprimé !' })
            })
            .catch((error) => res.status(401).json({ error }))
        })
      }
    })
    .catch((error) => {
      res.status(500).json({ error })
    })
}

exports.rateBook = (req, res, next) => {
  const newRate = req.body

  if (newRate.rating > 5 || newRate.rating < 0) {
    return res.status(400).json({ message: 'la note doit etre en 0 et 5' })
  }

  Book.findOne({
    _id: req.params.id,
  })

    .then((book) => {
      const ratings = book.ratings

      if (ratings.some((rating) => rating.userId === newRate.userId)) {
        return res
          .status(400)
          .json({ message: "vous ne pouvez notez qu'une seule fois" })
      }

      const newRating = { userId: newRate.userId, grade: newRate.rating }
      ratings.push(newRating)

      const sum = ratings.reduce((accumulator, rating) => {
        return accumulator + rating.grade
      }, 0)


      let averageRating = sum / ratings.length
      book.averageRating = averageRating.toFixed(1)

      book
        .save()
        .then(() => res.status(200).json(book))
        .catch((error) => {
          res.status(400).json({ error })
        })
    })
    .catch((error) => {
      res.status(400).json({
        error,
      })
    })
}
