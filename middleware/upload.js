const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'warpSong_stems', // Your Cloudinary folder
    resource_type: 'auto',
    allowed_formats: ['mp3', 'wav', 'ogg'],
  },
  file: (req, file) => {
    // Optional: Customize the filename
    return {
      filename: Date.now() + '-' + file.originalname,
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
