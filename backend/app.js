const dotenv = require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(express.json());
const path = require('path');


const userRoutes = require('./routes/user');
const bookRoutes = require('./routes/book');



mongoose.connect(`mongodb+srv://${process.env.MONGO_DB}`,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));



app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/api/books', bookRoutes)
app.use('/api/auth', userRoutes);


module.exports = app;