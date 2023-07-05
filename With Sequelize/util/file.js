const path = require('fs');

const deleteFile = (filePath) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      throw (err);
    }
  });
};

exports.deleteFile = deleteFile;

/*
  it does not work

  [TODO]
 */