// const multer = require('multer')
const path = require('path')

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, '../public/admin-assets/imgs/items'), (err, success) => {
//       if (err) {
//         throw new err
//       }
//     });
//   },
//   filename: function (req, file, cb) {
//     const name = Date.now() + '-' + file.originalname;
//     cb(null, name, (err, success) => {
//       if (err)
//         throw new err
//     });
//   }
// });
const multer = require('multer');

const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/banners'), (err, success) => {
      if (err) {
        throw new err
      }
    });
  },

  filename: function (req, file, cb) {
    const name = Date.now() + '-' + file.originalname;
    cb(null, name, (err, success) => {
      if (err)
        throw new err
    });
  }
});

// //uploading product images
// const upload = multer({ storage: storage });

//uploading banner images
const upload1 = multer({ storage: storage1 });

// module.exports = {
//   upload,
//   upload1
// }


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/admin-assets/imgs/items'), (err, success) => {
            if (err) {
              throw new err
          }
        });
  },
  filename: function (req, file, cb) {

    cb(null, file.originalname);
}
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
   
    cb(null, true); 
  }
});

module.exports = {upload,upload1}