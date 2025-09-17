const multer = require('multer');
const path = require('path');
const Log = require('../models/logModel');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.fieldname}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
    }
  }
}).array('media', 5);

const fileUploader = {
  uploadMedia: (req, res, next) => {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        Log.create({
          module: 'fileUploader',
          message: `Multer error during upload: ${err.message}`,
          type: 'error'
        });
        return res.status(500).json({ message: `Multer error: ${err.message}` });
      } else if (err) {
        Log.create({
          module: 'fileUploader',
          message: `Unknown error during upload: ${err.message}`,
          type: 'error'
        });
        return res.status(500).json({ message: `Error uploading file: ${err.message}` });
      }
      next();
    });
  }
};

module.exports = fileUploader;