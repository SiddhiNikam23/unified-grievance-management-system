//define how a complain looks like 
//define feild a form will have 


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
  currentStatus: { type: String, enum: ["Complaint Filed", "Under Review", "Investigation", "Resolved" , "Rejected"], default: "Complaint Filed" },
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
  sourcePlatform: String,
  sourcePostId: String,
  sourcePostUrl: String,
  sourceHandle: String,
  sourceAuthorName: String,
  sourceContent: String,
  sourceVerified: { type: Boolean, default: false },
  sourceImported: { type: Boolean, default: false },
  sourceImportedFrom: String,
  sourceImportedAt: Date,
  sourceVerificationScore: Number,
  sourceVerificationReason: String,
  sourceDetectedLocationText: String,
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
