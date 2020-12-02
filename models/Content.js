var mongoose = require('mongoose');

var ContentSchema = new mongoose.Schema({
  filename: String,
  filesize: Number,
  nb_pages: { type: Number, default: 0},
  mimetype: String,
  pagesPng: { type: Array, default : [] },
  pagesPngFull: { type: Array, default : [] },
  pagesPngPrev: { type: Array, default : [] },
  pagesPngThumb: { type: Array, default : [] },
  pagesWidth: { type: Array, default : [] },
  pagesHeight: { type: Array, default : [] },
  original_url: String,
  pdf_url: String,
  ip: String,
  title: String,
  created: { type: Date, default: null },
  updated: { type: Date, default: null },
  _folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder'},
  _organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization'},
  _member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member'}
}, { collection: 'content' });

ContentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

ContentSchema.set('toJSON', {
  virtuals: true
});

ContentSchema.set('toObject', {
  virtuals: true
});

// specify the transform schema option
if (!ContentSchema.options.toObject) ContentSchema.options.toObject = {};
ContentSchema.options.toObject.transform = function (doc, ret, options) {
  // remove the _id of every document before returning the result
  delete ret._id;
  delete ret.__v;
}

// specify the transform schema option
if (!ContentSchema.options.toJSON) ContentSchema.options.toJSON = {};
ContentSchema.options.toJSON.transform = function (doc, ret, options) {
  // remove the _id of every document before returning the result
  delete ret._id;
  delete ret.__v;
}

// AWS DocumentDB does not support full-text indexes
// ContentSchema.index({title: 'text'});

module.exports = mongoose.model('Content', ContentSchema);
