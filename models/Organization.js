var mongoose = require('mongoose');

var OrganizationSchema = new mongoose.Schema({
  //id: mongoose.Schema.Types.ObjectId,
  name: String,
  sub: String,
  type: { type: Number, default: 0 }, // WAPI-43 / type of organization: 0 = simple enterprise; 1 = trial/subscribe enterprise;
  subscriptions: { type: Array, default : [] }, // WAPI-79
  stripeCustomerId: { type: String, default: "" }, // WAPI-79 
  billingInfo: { type: mongoose.Schema.Types.Mixed, default: {}}, // WAPI-88
  permissions: { type: mongoose.Schema.Types.Mixed, default: {}},
  quota_controller: { type: mongoose.Schema.Types.Mixed, default: {}},
  default_member_permissions: { type: mongoose.Schema.Types.Mixed, default: {}},
  _folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null},
  _cloud: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cloud', default: []}],
  quota_current: { type: mongoose.Schema.Types.Mixed, default: {}},
  quota_boost: { type: Array, default : [] }
  /*ip: String,
  online: Boolean*/
}, {collection:"organization"});

OrganizationSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

OrganizationSchema.set('toJSON', {
  virtuals: true
});

OrganizationSchema.set('toObject', {
  virtuals: true
});

// specify the transform schema option
if (!OrganizationSchema.options.toObject) OrganizationSchema.options.toObject = {};
OrganizationSchema.options.toObject.transform = function (doc, ret, options) {
  // remove the _id of every document before returning the result
  delete ret._id;
  delete ret.__v;
}

// specify the transform schema option
if (!OrganizationSchema.options.toJSON) OrganizationSchema.options.toJSON = {};
OrganizationSchema.options.toJSON.transform = function (doc, ret, options) {
  // remove the _id of every document before returning the result
  delete ret._id;
  delete ret.__v;
}

function getModel(collection) {
  return mongoose.model('Organization', OrganizationSchema,collection);
}

module.exports = mongoose.model('Organization', OrganizationSchema);
module.exports.getModel = getModel;
