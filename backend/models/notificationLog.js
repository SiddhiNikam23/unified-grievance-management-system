const mongoose = require("mongoose");

const NotificationLogSchema = new mongoose.Schema(
  {
    grievanceCode: { type: String, index: true, required: true },
    notificationType: {
      type: String,
      enum: [
        "COMPLAINT_REGISTERED",
        "UNDER_REVIEW",
        "IN_PROCESS",
        "RESOLVED",
        "URGENT_ALERT"
      ],
      required: true,
      index: true
    },
    channel: {
      type: String,
      enum: ["email", "telegram", "slack"],
      required: true,
      index: true
    },
    recipient: { type: String, required: true, index: true },
    deliveryStatus: { type: String, enum: ["sent", "failed"], required: true },
    attemptCount: { type: Number, default: 1 },
    errorMessage: String,
    payload: {
      complaint_id: String,
      user_name: String,
      issue_type: String,
      location: String,
      status: String,
      timestamp: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("NotificationLog", NotificationLogSchema);
