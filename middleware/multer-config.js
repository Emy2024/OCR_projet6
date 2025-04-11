const multer = require('multer')

const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

const storage = multer.diskStorage({
   // Configuration du dossier de destination
    destination: (req, file, callback) => {
        callback(null, 'images');
    },
    //Configuration du nom du fichier
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_').replace(/\.jpeg|\.jpg|\.png/g, "_");
        const extension = MIME_TYPES[file.mimetype];
        callback(null, name + Date.now() + '.' + extension);
    }
});

module.exports = multer({storage: storage}).single('image');

