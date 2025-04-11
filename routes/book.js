const express = require('express')
const router = express.Router()

// Middlewares
const auth = require('../middleware/authentification');
const sharp = require('../middleware/sharp-config');
const multer = require('../middleware/multer-config');

// Logique métier
const bookController = require('../controllers/book')

// Router
//routes publiques : pas besoin d'être connecté
router.get('/', bookController.getAllBooks)
router.get('/bestrating', bookController.getBestRatedBooks)
router.get('/:id', bookController.getOneBook) 
 
//routes privées : authentification nécessaire
router.post('/', auth, multer, sharp, bookController.createBook)
router.post('/:id/rating', auth, bookController.rateBook)
router.put('/:id', auth, multer, sharp, bookController.updateBook)
router.delete('/:id', auth, bookController.deleteBook)

module.exports = router

