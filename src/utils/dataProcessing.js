const mongoose = require('mongoose');

exports.replaceNullIds = function replaceNullIds(obj) {
  if (obj && typeof obj === 'object') {
    if (obj._id === null) {
      obj._id = new mongoose.Types.ObjectId();
    }
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object') {
        replaceNullIds(obj[key]);
      }
    });
  }
  return obj;
};

exports.verifyInsertion = async function verifyInsertion(doc) {
  // Implement verification logic here
  // You might want to check if all _id fields are populated
};