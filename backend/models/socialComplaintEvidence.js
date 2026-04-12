const mongoose = require("mongoose");

const SnapshotSchema = new mongoose.Schema(
  {
    capturedAt: { type: Date, default: Date.now },
    contentText: { type: String, default: "" },
    contentHash: { type: String, required: true },
    postUrl: { type: String, default: "" },
    sourceProbe: { type: String, enum: ["ingestion", "verification", "manual"], default: "ingestion" },
    metadata: { type: Object, default: {} }
  },
  { _id: false }
);

const VerificationEventSchema = new mongoose.Schema(
  {
    checkedAt: { type: Date, default: Date.now },
    availability: {
      type: String,
      enum: ["live", "deleted", "unknown"],
      default: "unknown"
    },
    httpStatus: Number,
    notes: String,
    checker: { type: String, default: "system" }
  },
  { _id: false }
);

const SocialComplaintEvidenceSchema = new mongoose.Schema(
  {
    grievanceCode: { type: String, index: true },
    platform: {
      type: String,
      enum: ["twitter", "reddit", "instagram", "facebook", "youtube", "other"],
      default: "other",
      index: true
    },
    externalPostId: { type: String, index: true },
    postUrl: { type: String, index: true },
    authorHandle: { type: String, default: "" },
    issueType: { type: String, default: "General" },
    locationText: { type: String, default: "Unknown" },
    hashtags: { type: [String], default: [] },
    complaintText: { type: String, default: "" },
    firstCapturedAt: { type: Date, default: Date.now, index: true },
    lastObservedAt: { type: Date, default: Date.now },
    lastVerifiedAt: Date,
    availabilityStatus: {
      type: String,
      enum: ["live", "deleted", "unknown"],
      default: "unknown",
      index: true
    },
    lifecycleStatus: {
      type: String,
      enum: ["Detected", "Triaged", "Investigating", "Actioned", "Resolved", "Rejected"],
      default: "Detected",
      index: true
    },
    authenticity: {
      aiScore: { type: Number, default: 0 },
      crossSourceScore: { type: Number, default: 0 },
      signalScore: { type: Number, default: 0 },
      overallScore: { type: Number, default: 0 },
      confidenceBand: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Low"
      },
      reasons: { type: [String], default: [] },
      verifiedAt: Date
    },
    duplicateHints: {
      matchingComplaintCodes: { type: [String], default: [] },
      totalMatches: { type: Number, default: 0 }
    },
    snapshots: { type: [SnapshotSchema], default: [] },
    verificationEvents: { type: [VerificationEventSchema], default: [] }
  },
  { timestamps: true }
);

SocialComplaintEvidenceSchema.index({ platform: 1, externalPostId: 1 }, { unique: true, sparse: true });
SocialComplaintEvidenceSchema.index({ platform: 1, postUrl: 1 }, { unique: true, sparse: true });
SocialComplaintEvidenceSchema.index({ lifecycleStatus: 1, availabilityStatus: 1, createdAt: -1 });

module.exports = mongoose.model("SocialComplaintEvidence", SocialComplaintEvidenceSchema);
