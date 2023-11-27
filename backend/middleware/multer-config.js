const multer = require('multer')

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images')
  },
  filename: (req, file, callback) => {
    const nameWithoutExt = file.originalname.split('.')
    delete nameWithoutExt[nameWithoutExt.length - 1]

    const name = nameWithoutExt[0].split(' ').join('_')
    const extension = MIME_TYPES[file.mimetype]
    const newName = name + Date.now() + '.' + extension

    callback(null, newName)
  },
})

module.exports = multer({ storage: storage }).single('image')
