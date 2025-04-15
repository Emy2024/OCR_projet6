// Import
const Book = require('../models/Book');

// Avoir accès au file system
const fs = require('fs');

// POST > Publie un nouveau livre
exports.createBook = async (req, res, next) => {
    try{
        const bookObject = JSON.parse(req.body.book) 
        delete bookObject._id; 
        delete bookObject._userId; 
        const book = new Book({
            ...bookObject,
            userId: req.auth.userId,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename.replace(/\.jpeg|\.jpg|\.png/g, "_")}thumbnail.webp`
        })

        await book.save()

        res.status(201).json({ message: 'Livre enregistré!'})

    } catch(error) {
        res.status(400).json("Le livre n'a pas pu être enregistré")
        console.log("controllers>book>createBook : ", {error})
    }
} 

// POST > Définit la note pour le user ID fourni
exports.rateBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then( book => {    
        const isBookAlreadyRated = book.ratings.find((book) => book.userId === req.auth.userId);
          if (!isBookAlreadyRated) {
            book.ratings.push({
                userId: req.auth.userId,
                grade: req.body.rating
            })
            // Cumule d'une valeur à partir d'un tableau
            let newAverageRating = book.ratings.reduce((accumulator, currentValue) => accumulator + currentValue.grade, 0)/book.ratings.length;
            book.averageRating = newAverageRating;

            return book.save()
            
            } else {
                res.status(401).json({message: 'Livre déjà noté'});
            }
        })
    .then(book => res.status(201).json(book))
    .catch(error => {
        res.status(500).json("Le livre n'a pas pu être noté")
        console.log("controllers>book>rateBook : ", {error})
    });
}

// PUT > Met à jour le livre avec l'_id fourni
exports.updateBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename.replace(/\.jpeg|\.jpg|\.png/g, "_")}thumbnail.webp`
    } : { ...req.body };

    delete bookObject._userId;
    
    console.log(req.auth)

    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message : 'Utilisateur pas authorisé à modifier le livre'});
            } else {
                if(bookObject.imageUrl){
                    const filenameThumb = book.imageUrl.split('/images/')[1];
                    const filenameLarge = filenameThumb.split('_thumbnail')[0];
                    fs.unlink(`images/${filenameLarge}.jpg`, () => { });
                    fs.unlink(`images/${filenameLarge}.png`, () => { });
                    fs.unlink(`images/${filenameThumb}`, () => { });
                }
                Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
                .then(() => res.status(200).json({message : 'Livre modifié'}))
                .catch(error => {
                    res.status(401).json("Le livre n'a pas pu être mis-à-jour")
                    console.log("controllers>book>updateBook : ", {error})
                });
            }
        })
        .catch(error => {
            res.status(400).json("Le livre n'a pas pu être mis-à-jour")
            console.log("controllers>book>updateBook : ", {error})
        });
}

// GET > Renvoie tous les livres
exports.getAllBooks = (req, res, next) => {
    Book.find()
     .then(books => res.status(200).json(books))
     .catch(error => {
        res.status(400).json("Les livres n'ont pas été trouvés")
        console.log("controllers>book>getAllBooks : ", {error})
    });
}

// GET > Renvoie le livre avec l'id fourni
exports.getOneBook = (req, res, next) => {
   Book.findOne({ _id: req.params.id })
    .then(book => res.status(200).json(book))
    .catch(error => {
        res.status(404).json("Le livre n'a pas été trouvé")
        console.log("controllers>book>getOneBook : ", {error})
    });
}

// GET > Renvoie un tableau des 3 livres de la base de données ayant la meilleure note moyenne.
exports.getBestRatedBooks = (req, res, next) => {
    Book.find()
     .then(books => {
        books.sort((a, b) => b.averageRating - a.averageRating);
        const bestRatedBooks = books.slice(0, 3);
        res.status(201).json(bestRatedBooks)
     })
    .catch(error => {
        res.status(404).json("La moyenne des meilleures notes n'a pas été trouvée")
        console.log("controllers>book>getBestRatedBooks : ", {error})
    });
}

// DELETE > Supprime le livre avec l'_id fourni ainsi que l’image associée
exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id})
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({message: 'Vous n\'êtes pas authorisé à supprimer ce livre'});
            } else {
                const filenameThumb = book.imageUrl.split('/images/')[1];
                const filenameLarge = filenameThumb.split('_thumbnail')[0];
                fs.unlink(`images/${filenameLarge}.jpg`, () => { });
                fs.unlink(`images/${filenameLarge}.png`, () => { });
                fs.unlink(`images/${filenameThumb}`, () => {
                    book.deleteOne({_id: req.params.id}) 
                        .then(() => { res.status(200).json({message: 'Livre supprimé !'})})
                        .catch(error => res.status(401).json({ error }));
                    });
            }
        })
        .catch(error => {
            res.status(500).json("Impossible de supprimer le livre")
            console.log("controllers>book>deleteBook : ", {error})
        });
};
