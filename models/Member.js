var mongoose = require('mongoose');
var Organization = require('./Organization.js');

var MemberSchema = new mongoose.Schema({
  //id: mongoose.Schema.Types.ObjectId,
  username: String,
  mail: String,
  lastName: { type: String, default: "" },
  firstName: { type: String, default: "" },
  notes: { type: String, default: "" },
  password: { type:String, select:false },
  profil: { type: Number, default: 0 },
  organizationOwner: { type: Boolean, default: false }, // WAPI-79 / related to the trial/subscription implementation. Organization owner, who created an account
  superAdmin: { type: Boolean, default: false },
  actif: { type: Boolean, default: false },
  picture: { type: Buffer, default: null },
  display_preferences: { type: String, default: "normal" },
  pdfz_list: { type: String, default: "mine" },
  twitter: { type: String, default: "" },
  created: { type: Date, default: Date.now },
  lastAuth: { type: Date, default: Date.now },
  permissions: { type: mongoose.Schema.Types.Mixed, default: {}},
  _organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization'},
  howMemberPlanToUseWizeflow: { type: String, default: "" },
  position: { type: String, default: "" },
  phone: { type: String, default: "" }
}, {collection:"member"});

MemberSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

MemberSchema.set('toJSON', {
  virtuals: true
});

MemberSchema.set('toObject', {
  virtuals: true
});

// specify the transform schema option
if (!MemberSchema.options.toObject) MemberSchema.options.toObject = {};
MemberSchema.options.toObject.transform = function (doc, ret, options) {
  ret.username_sort = doc.username.toLowerCase();
  // remove the _id of every document before returning the result
  delete ret._id;
  delete ret.__v;
}

// specify the transform schema option
if (!MemberSchema.options.toJSON) MemberSchema.options.toJSON = {};
MemberSchema.options.toJSON.transform = function (doc, ret, options) {
  ret.username_sort = doc.username.toLowerCase();
  // remove the _id of every document before returning the result
  delete ret._id;
  delete ret.__v;
}

function getModel(collection) {
  return mongoose.model('Member', MemberSchema,collection);
}

module.exports = mongoose.model('Member', MemberSchema);
module.exports.getModel = getModel;
