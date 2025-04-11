require("dotenv").config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const tokenSecret = process.env.TOKEN_SECRET;

exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10)
    .then(hash => {
        const user = new User({
            email: req.body.email,
            password: hash
        });
        user.save()
        .then(() => res.status(201).json({ message: 'Utilisateur créé'}))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => {
        res.status(500).json("Une erreur est survenue lors du signup.")
        console.log("controllers>user>signup : ", {error})
    });
};

exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email})
    .then(user => {
        if(!user) {
            return res.status(401).json({ error: 'Le couple identifiant /mot de passe est incorrect.'});
        }
        bcrypt.compare(req.body.password, user.password)
        .then(valid => {
            if(!valid) {
                return res.status(401).json({ error: 'Le couple identifiant /mot de passe est incorrect.'})
            }
            res.status(200).json({
              userId: user._id,
              token: jwt.sign(
                  { userId: user._id },
                  tokenSecret,
                  { expiresIn: '24h'}
                  )
            });
        })
        .catch(error => {
            res.status(500).json("Une erreur est survenue lors du login.")
            console.log("controllers>user>login : ", {error})
        });
    })
     .catch(error => {
        res.status(500).json("Une erreur est survenue lors du login.")
        console.log("controllers>user>login : ", {error})
    });
};

