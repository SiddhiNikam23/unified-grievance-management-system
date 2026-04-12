const mongoose = require('mongoose');

const SocialComplaintSchema = new mongoose.Schema({
  sourcePlatform: { type: String, required: true },
  sourcePostId: { type: String, default: null },
  sourcePostUrl: { type: String, default: null },
  sourceHandle: { type: String, default: null },
  sourceAuthorName: { type: String, default: null },
  sourceContent: { type: String, required: true },
  sourceLanguage: { type: String, default: 'en' },
  sourcePostedAt: { type: Date, default: Date.now },
  detectedLocationText: { type: String, default: null },
  detectedLocationHint: {
    latitude: Number,
    longitude: Number,
    accuracy: Number
  },
  isComplaint: { type: Boolean, default: false },
  verificationScore: { type: Number, default: 0 },
  verificationReason: { type: String, default: '' },
  department: { type: String, default: '' },
  category: { type: String, default: '' },
  subcategory: { type: String, default: '' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  priorityReason: { type: String, default: '' },
  matchedKeywords: [{ type: String }],
  grievanceCreated: { type: Boolean, default: false },
  grievanceCode: { type: String, default: null },
  grievanceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  importedBy: { type: String, default: null },
  importedAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ['Detected', 'Verified', 'Imported', 'Rejected'],
    default: 'Detected'
  }
}, { timestamps: true });

module.exports = mongoose.model('SocialComplaint', SocialComplaintSchema);
