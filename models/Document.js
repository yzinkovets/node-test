var mongoose = require('mongoose');

var DocumentSchema = new mongoose.Schema({
  //id: mongoose.Schema.Types.ObjectId,
  uuid: String,
  filename: String,
  filesize: Number,
  nb_pages: { type: Number, default: 0},
  nb_pages_processed: { type: Number, default: 0},
  pour_pages_processed: { type: Number, default: 0},
  mimetype: String,
  pages: { type: Array, default : [] },
  pagesAR: { type: Array, default : [] },
  pagesBear: { type: Array, default : [] },
  pagesPng: { type: Array, default : [] },
  pagesPngFull: { type: Array, default : [] },
  pagesPngPrev: { type: Array, default : [] },
  pagesPngThumb: { type: Array, default : [] },
  pagesDzi: { type: Array, default : [] },
  pagesWidth: { type: Array, default : [] },
  pagesHeight: { type: Array, default : [] },
  campaignLanguage: { type: Array, default : [] },
  auras: { type: Array, default : [] },
  crops: { type: Array, default : [] },
  arts: { type: Array, default : [] },
  files: { type: Object, default : {} },
  book_id: Number,
  status: String,
  ar_multi_language: { type: Boolean, default: false},
  ar_multi_language_list: { type: Array, default: []},
  ar_default_language: String,
  pdf_url: String,
  pdfz_url: String,
  pdfzs_url: String,
  pdfzs_bitly_url: String,
  pdfz_url_user: String,
  pdfzs_url_user: String,
  pdfzr_url: String,
  pdfa_url: String,
  pdfz_version: { type: String, default : "default"}, 
  pdfa_password: { type: String, default : ""},
  pdfz_password: { type: String, default : ""},
  username: String,
  ip: String,
  google_analytic: { type: String, default: ""},
  firstPage: { type: String, "default" : ""},
  config: mongoose.Schema.Types.Mixed,
  pdfz_settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  distrib: mongoose.Schema.Types.Mixed,
  publication: String,
  edition: String,
  theme: String,
  pivotviewer: { type: Boolean, default: false},
  pixmax: { type: String, default: "1100" },
  pixmargin: { type: String, default: "0" },
  t5: { type: String, default: "60" },
  dotiles: { type: String, default: "false" },
  vgw: { type: String, default: "10.0" },
  vgwref: { type: String, default: "1000" },
  vgwmin: { type: String, default: "300" },
  vmargel: { type: String, default: "0.0" },
  vmarger: { type: String, default: "0.0" },
  vmargol: { type: String, default: "0.0" },
  vmargor: { type: String, default: "0.0" },
  marko_mode: { type: String, default: "4"} ,
  title: String,
  inserted: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  pdfzSize: { type: Number, default: 0 },
  pdfzGzipSize: { type: Number, default: 0 },
  pdfzDeflateSize: { type: Number, default: 0 },
  cloud: { type: Number, default: 0 },
  error: { type: Array, default: [] },
  _publication: { type: mongoose.Schema.Types.ObjectId, ref: 'Publication'},
  _member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member'},
  _folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder'},
  _content: { type: mongoose.Schema.Types.ObjectId, ref: 'Content'},
  _edition: { type: mongoose.Schema.Types.ObjectId, ref: 'Edition'},
  _theme: { type: mongoose.Schema.Types.ObjectId, ref: 'Theme', default: null},
  _organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization'},
  _bear_account: { type: mongoose.Schema.Types.ObjectId, ref: 'BearAccount', default: null},
  completed: Boolean,
  distribution: { type: Number, default: 0},
  activated: { type: Boolean, default: true},
  publish: { type: Boolean, default: false},
  aura2asset: { type: Boolean, default: false},
  ar: { type: String, default: "1"},
  ar_content: { type: String, default: "1"},
  callback_post: { type: String, default: ""},
  tracking_email: { type: String, default: "" }
}, { collection: 'documents' });

DocumentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

DocumentSchema.set('toJSON', {
  virtuals: true
});

DocumentSchema.set('toObject', {
  virtuals: true
});

// specify the transform schema option
if (!DocumentSchema.options.toObject) DocumentSchema.options.toObject = {};
DocumentSchema.options.toObject.transform = function (doc, ret, options) {
  // remove the _id of every document before returning the result
  delete ret._id;
  delete ret.__v;
}

// specify the transform schema option
if (!DocumentSchema.options.toJSON) DocumentSchema.options.toJSON = {};
DocumentSchema.options.toJSON.transform = function (doc, ret, options) {
  // remove the _id of every document before returning the result
  delete ret._id;
  delete ret.__v;
}

// AWS DocumentDB does not support full-text indexes
// DocumentSchema.index({title: 'text', '_folder.name': 'text'});

const statuses = {
  ANALYSING_IN_PROGRESS: "ANALYSING_IN_PROGRESS",
  AUGMENT_DONE: "AUGMENT_DONE",
  CLEAN_PDFZ_ERROR: "CLEAN_PDFZ_ERROR",
  CREATED: "CREATED",
  DELETING_BEAR: "DELETING_BEAR",
  DONE: "DONE",
  PROCESSING_STARTED: "PROCESSING_STARTED",
  PROCESSING_ERROR: "PROCESSING_ERROR",
  PROCESSING_DONE: "PROCESSING_DONE",
  PROCESSING_RESTARTED: "PROCESSING_RESTARTED",
  TRASHED: "TRASHED",
  UPDATE_PDFZ: "UPDATE_PDFZ",
  UPDATE_AR: "UPDATE_AR",
  UPDATE_PDF: "UPDATE_PDF"
}

module.exports = mongoose.model('Document', DocumentSchema);
module.exports.statuses = statuses;
