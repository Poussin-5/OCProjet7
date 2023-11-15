const Book = require('../models/book');
const sharp = require ('sharp');
const fs = require('fs');






exports.getAllBooks = (req, res, next) => {
    Book.find()
    .then( (books) => {
        res.status(200).json(books);
      })
    .catch(
      (error) => {
        res.status(400).json({
          error: error
        });
      }
    );
  };

exports.getOneBook = (req, res, next) => {
    Book.findOne({
      _id: req.params.id
    })
    .then(
      (book) => {
        res.status(200).json(book);
      }
    )
    .catch(
      (error) => {
        res.status(404).json({
          error: error
        });
      }
    );
  };

  exports.getBestBooks = (req, res, next) => {
   Book.find()
    .then( (bestBooks) => {
        bestBooks.sort((a, b) => b.averageRating - a.averageRating)
        bestBooks.length = 3
        res.status(200).json(bestBooks);
      })
    .catch(
      (error) => {
        res.status(400).json({
          error: error
        });
      }
    );
  };
       
 

  exports.createBook =  async (req, res, next) => {


    let compressName = `images/compress_${req.file.filename}`
     await sharp(req.file.path)
      .resize({heigth : 300})
      .toFile(compressName) 
      
    
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/${compressName}`
    });

   
    

    book.save()
    .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
    .catch(error => { res.status(400).json( { error })})

    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error(err);
      } else {
        // Suppression réussie !
      }
    });
 };

 exports.modifyBook = async (req, res, next) => {

  let compressName = `images/compress_${req.file.filename}`
  if (req.file) {
   await sharp(req.file.path)
    .resize({heigth : 300})
    .toFile(compressName) 
  }
  
      const bookObject = req.file ? {
          ...JSON.parse(req.body.book),
          imageUrl: `${req.protocol}://${req.get('host')}/${compressName}`
      } : { ...req.body };
  
      delete bookObject._userId;
      Book.findOne({_id: req.params.id})
          .then((book) => {
              if (book.userId != req.auth.userId) {
                  res.status(401).json({ message : 'Not authorized'});
              } else {
                  Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
                  .then(() => res.status(200).json({message : 'Objet modifié!'}))
                  .catch(error => res.status(401).json({ error }));
                  fs.unlink( `images/${req.file.filename}`, (err) => {
                    if (err) {
                      console.error(err);
                    } 
                  });
              }
          })
          .catch((error) => {
              res.status(400).json({ error });
          });
  
         
   };
  


 exports.deleteBook = (req, res, next) => {
   
    Book.findOne({ _id: req.params.id})
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({message: 'Not authorized'});
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
 };

 exports.rateBook = (req, res, next) => {

const newRate = req.body

Book.findOne({
    _id: req.params.id
  })
  .then(
    (book) => {      
    const newRating = {userId : newRate.userId, grade : newRate.rating}
    const ratings = book.ratings
    ratings.push(newRating)

    const grades = []
    ratings.forEach( rating => { grades.push(rating.grade)});

    let sum = 0;
    for (let i = 0; i < grades.length; i++) {sum += grades[i];}
    let averageRating = sum/grades.length
    book.averageRating = averageRating
   
    book.save()
    .then(() => res.status(200).json(book))
    .catch(error => { res.status(400).json( { error })})
    }
  )
  .catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
   

 }
