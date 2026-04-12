const mongoose = require("mongoose");
const GrievanceSchema = new mongoose.Schema({
  grievanceCode: { type: String, unique: true },
  complainantName: String,
  complainantEmail: String,
  dateOfReceipt: Date,
  department: String,
  category: String,
  subcategory: String,
  priority: { 
    type: String, 
    enum: ["Low", "Medium", "High", "Critical"], 
    default: "Medium" 
  },
  priorityReason: String,
  percentageCompletion: Number,
  isSpam: {type: Boolean, default: false},
  aiResolved:{type: Boolean, default: false},
  aiResolutionText: String,
  aiResolutionPDF: String,
  aiResolvedAt: Date,
  description: String,
  fileName: String,
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date
  },
  locationText: String,
  issueType: String,
  sentimentTag: {
    type: String,
    enum: ["Negative", "Urgent", "Critical"],
    default: "Negative"
  },
  validityScore: { type: Number, default: 0 },
  moderationStatus: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  },
  moderationReason: String,
  detectedAt: Date,
  currentStatus: { type: String, enum: ["Complaint Filed", "Under Review", "Investigation", "Resolved" , "Rejected"], default: "Complaint Filed" },
  source: { type: String, enum: ["web", "mobile", "twitter", "reddit", "instagram", "whatsapp"], default: "web" },
  sourceMetadata: {
    twitterTweetId: String,
    twitterHandle: String,
    twitterMediaUrls: [String],
    redditPostId: String,
    redditPermalink: String,
    redditSubreddit: String,
    instagramPostId: String,
    instagramPermalink: String,
    socialPostUrl: String,
    socialPlatform: String,
    socialUsername: String,
    socialHashtags: [String],
    socialCapturedAt: Date,
    mobileDeviceId: String,
    mobileOS: String
  },
  isEscalated: { type: Boolean, default: false },
  escalatedAt: Date,
  escalationReason: String,
  escalatedTo: { type: String, default: "Emergency Response Team" },
  autoEscalated: { type: Boolean, default: false },
  isDuplicate: { type: Boolean, default: false },
  linkedTo: String, 
  linkedComplaints: [String], 
  duplicateDetectedAt: Date,
  similarityScore: Number,
  duplicateReason: String,
  duplicateGroup: String, 
  adminQuestions: [{
    question: String,
    askedAt: { type: Date, default: Date.now },
    askedBy: String,
    reply: String,
    replyDocument: String,
    repliedAt: Date
  }]
}, { timestamps: true });
GrievanceSchema.pre("save", async function (next) {
  if (!this.grievanceCode) {
    this.grievanceCode = `GRV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});
module.exports = mongoose.model("Grievance", GrievanceSchema);
