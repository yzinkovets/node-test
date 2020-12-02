var mongoose = require('mongoose');
//var Publication = require('./Publication.js');

var FolderSchema = new mongoose.Schema({
  //id: mongoose.Schema.Types.ObjectId,
  name: String,
  readOnly: { type: Boolean, default: false},
  /*mail: String,
  password: String,
  profil: { type: Number, default: 0 },
  superAdmin: { type: Boolean, default: false },
  actif: { type: Boolean, default: false },
  picture: { type: Buffer, default: null },
  display_preferences: { type: String, default: "normal" },
  pdfz_list: { type: String, default: "mine" },*/
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  _folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null},
  _organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null}
}, {collection:"folder"});

FolderSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

FolderSchema.set('toJSON', {
  virtuals: true
});

FolderSchema.set('toObject', {
  virtuals: true
});

// specify the transform schema option
if (!FolderSchema.options.toObject) FolderSchema.options.toObject = {};
FolderSchema.options.toObject.transform = function (doc, ret, options) {
  // remove the _id of every document before returning the result
  delete ret._id;
  delete ret.__v;
}

// specify the transform schema option
if (!FolderSchema.options.toJSON) FolderSchema.options.toJSON = {};
FolderSchema.options.toJSON.transform = function (doc, ret, options) {
  // remove the _id of every document before returning the result
  delete ret._id;
  delete ret.__v;
}

function getModel(collection) {
  return mongoose.model('Folder', FolderSchema, collection);
}

module.exports = mongoose.model('Folder', FolderSchema);
