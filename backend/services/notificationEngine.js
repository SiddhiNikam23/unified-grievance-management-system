const nodemailer = require("nodemailer");
const axios = require("axios");
const NotificationLog = require("../models/notificationLog");

const EVENT_TO_SUBJECT = {
  COMPLAINT_REGISTERED: "Government Grievance Portal - Complaint Registered",
  UNDER_REVIEW: "Government Grievance Portal - Complaint Under Process",
  IN_PROCESS: "Government Grievance Portal - Complaint In Process",
  RESOLVED: "Government Grievance Portal - Complaint Resolved",
  URGENT_ALERT: "Government Grievance Portal - Urgent Civic Issue Detected"
};

const EVENT_TO_STATUS_TEXT = {
  COMPLAINT_REGISTERED: "Complaint Filed",
  UNDER_REVIEW: "Under Review",
  IN_PROCESS: "Investigation",
  RESOLVED: "Resolved",
  URGENT_ALERT: "Under Review"
};

function getAdminEmails() {
  return String(process.env.ADMIN_ALERT_EMAILS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function getTelegramChatIds() {
  return String(process.env.TELEGRAM_ADMIN_CHAT_IDS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function isLikelyRealUserEmail(email) {
  if (!email || !email.includes("@")) {
    return false;
  }
  if (email.endsWith(".social")) {
    return false;
  }
  return true;
}

function buildPayload(grievance, notificationType) {
  return {
    complaint_id: grievance.grievanceCode,
    user_name: grievance.complainantName || "Citizen",
    issue_type: grievance.issueType || grievance.subcategory || grievance.category || "General",
    location: grievance.locationText || "Unknown",
    status: EVENT_TO_STATUS_TEXT[notificationType] || grievance.currentStatus || "Complaint Filed",
    timestamp: new Date()
  };
}

function buildFormalEmailHtml({ grievance, notificationType, messageText }) {
  const issueType = grievance.issueType || grievance.subcategory || grievance.category || "General";
  const location = grievance.locationText || "Unknown";
  const issuedAt = new Date().toLocaleString();

  return `
  <div style="font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; line-height: 1.55;">
    <p><strong>Government Grievance Redressal Cell</strong><br/>Department of Civic Administration</p>
    <p>Reference No: ${grievance.grievanceCode}<br/>Date: ${issuedAt}</p>
    <p>Dear ${grievance.complainantName || "Citizen"},</p>
    <p>${messageText}</p>
    <table style="border-collapse: collapse; width: 100%; margin: 12px 0;">
      <tr><td style="border:1px solid #d8d8d8; padding:8px;"><strong>Complaint ID</strong></td><td style="border:1px solid #d8d8d8; padding:8px;">${grievance.grievanceCode}</td></tr>
      <tr><td style="border:1px solid #d8d8d8; padding:8px;"><strong>Issue Type</strong></td><td style="border:1px solid #d8d8d8; padding:8px;">${issueType}</td></tr>
      <tr><td style="border:1px solid #d8d8d8; padding:8px;"><strong>Location</strong></td><td style="border:1px solid #d8d8d8; padding:8px;">${location}</td></tr>
      <tr><td style="border:1px solid #d8d8d8; padding:8px;"><strong>Status</strong></td><td style="border:1px solid #d8d8d8; padding:8px;">${EVENT_TO_STATUS_TEXT[notificationType] || grievance.currentStatus}</td></tr>
      <tr><td style="border:1px solid #d8d8d8; padding:8px;"><strong>Timestamp</strong></td><td style="border:1px solid #d8d8d8; padding:8px;">${issuedAt}</td></tr>
    </table>
    <p>This is an official communication from the Grievance Management System. Please retain this reference for all future correspondence.</p>
    <p>Sincerely,<br/>Authorized Officer<br/>Government Grievance Redressal Cell</p>
    <p style="font-size:12px; color:#666;">This is an automated government notification. Please do not reply to this message.</p>
  </div>`;
}

function buildUserMessage(notificationType) {
  if (notificationType === "COMPLAINT_REGISTERED") {
    return "Your complaint has been sent successfully and registered on the Government Grievance Portal. Your request is currently under review.";
  }
  if (notificationType === "UNDER_REVIEW") {
    return "Your complaint has been received by the concerned authority and is now under process.";
  }
  if (notificationType === "IN_PROCESS") {
    return "Your complaint is in process. Necessary administrative action is being taken by the concerned department.";
  }
  if (notificationType === "RESOLVED") {
    return "Your complaint has been successfully resolved. Thank you for your patience and cooperation.";
  }
  return "An update has been recorded for your complaint.";
}

function buildAdminUrgentMessage(grievance) {
  return [
    "URGENT ISSUE DETECTED",
    `Issue: ${grievance.issueType || grievance.subcategory || "General"}`,
    `Location: ${grievance.locationText || "Unknown"}`,
    `Description: ${String(grievance.description || "").slice(0, 400)}`,
    `Priority: ${grievance.priority || "High"}`,
    `Complaint ID: ${grievance.grievanceCode}`
  ].join("\n");
}

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_FROM) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        : undefined
  });
}

async function sendWithRetry(sendFn, maxAttempts = 3) {
  let attempt = 0;
  let lastError = null;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      await sendFn();
      return { ok: true, attemptCount: attempt, error: null };
    } catch (error) {
      lastError = error;
    }
  }

  return { ok: false, attemptCount: maxAttempts, error: lastError };
}

async function isAlreadySent({ grievanceCode, notificationType, channel, recipient }) {
  const existing = await NotificationLog.findOne({
    grievanceCode,
    notificationType,
    channel,
    recipient,
    deliveryStatus: "sent"
  }).lean();

  return Boolean(existing);
}

async function writeLog({ grievance, notificationType, channel, recipient, result }) {
  const payload = buildPayload(grievance, notificationType);
  const doc = await NotificationLog.create({
    grievanceCode: grievance.grievanceCode,
    notificationType,
    channel,
    recipient,
    deliveryStatus: result.ok ? "sent" : "failed",
    attemptCount: result.attemptCount,
    errorMessage: result.error ? result.error.message : "",
    payload
  });

  return {
    notification_type: notificationType,
    channel,
    recipient,
    status: doc.deliveryStatus,
    timestamp: doc.createdAt
  };
}

async function sendEmailNotification({ grievance, notificationType, recipient, customText }) {
  const transporter = createTransporter();
  if (!transporter) {
    const failure = { ok: false, attemptCount: 1, error: new Error("SMTP is not configured") };
    return writeLog({ grievance, notificationType, channel: "email", recipient, result: failure });
  }

  const subject = EVENT_TO_SUBJECT[notificationType] || "Complaint Update";
  const text = customText || buildUserMessage(notificationType);
  const html = buildFormalEmailHtml({ grievance, notificationType, messageText: text });

  if (await isAlreadySent({ grievanceCode: grievance.grievanceCode, notificationType, channel: "email", recipient })) {
    return {
      notification_type: notificationType,
      channel: "email",
      recipient,
      status: "sent",
      timestamp: new Date()
    };
  }

  const result = await sendWithRetry(async () => {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: recipient,
      subject,
      text,
      html
    });
  });

  return writeLog({ grievance, notificationType, channel: "email", recipient, result });
}

async function sendTelegramUrgent(grievance) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = getTelegramChatIds();
  const output = [];

  if (!token || !chatIds.length) {
    return output;
  }

  const text = buildAdminUrgentMessage(grievance);

  for (const chatId of chatIds) {
    const recipient = `telegram:${chatId}`;
    if (await isAlreadySent({ grievanceCode: grievance.grievanceCode, notificationType: "URGENT_ALERT", channel: "telegram", recipient })) {
      output.push({
        notification_type: "URGENT_ALERT",
        channel: "telegram",
        recipient,
        status: "sent",
        timestamp: new Date()
      });
      continue;
    }

    const result = await sendWithRetry(async () => {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text
      });
    });

    output.push(
      await writeLog({
        grievance,
        notificationType: "URGENT_ALERT",
        channel: "telegram",
        recipient,
        result
      })
    );
  }

  return output;
}

async function sendSlackUrgent(grievance) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    return [];
  }

  const recipient = "slack:webhook";
  if (await isAlreadySent({ grievanceCode: grievance.grievanceCode, notificationType: "URGENT_ALERT", channel: "slack", recipient })) {
    return [
      {
        notification_type: "URGENT_ALERT",
        channel: "slack",
        recipient,
        status: "sent",
        timestamp: new Date()
      }
    ];
  }

  const result = await sendWithRetry(async () => {
    await axios.post(webhook, {
      text: `*URGENT ISSUE DETECTED*\nIssue: ${grievance.issueType || grievance.subcategory || "General"}\nLocation: ${grievance.locationText || "Unknown"}\nDescription: ${String(grievance.description || "").slice(0, 400)}\nPriority: ${grievance.priority || "High"}\nComplaint ID: ${grievance.grievanceCode}`
    });
  });

  return [
    await writeLog({
      grievance,
      notificationType: "URGENT_ALERT",
      channel: "slack",
      recipient,
      result
    })
  ];
}

async function notifyAdminUrgentChannels(grievance) {
  if (!["High", "Critical"].includes(grievance.priority)) {
    return [];
  }

  const logs = [];

  const adminEmails = getAdminEmails();
  for (const email of adminEmails) {
    logs.push(
      await sendEmailNotification({
        grievance,
        notificationType: "URGENT_ALERT",
        recipient: email,
        customText: "An urgent civic issue has been detected and requires immediate administrative attention."
      })
    );
  }

  const tgLogs = await sendTelegramUrgent(grievance);
  const slackLogs = await sendSlackUrgent(grievance);

  return [...logs, ...tgLogs, ...slackLogs];
}

async function notifyUserLifecycle({ grievance, notificationType }) {
  if (!isLikelyRealUserEmail(grievance.complainantEmail)) {
    return [];
  }

  const log = await sendEmailNotification({
    grievance,
    notificationType,
    recipient: grievance.complainantEmail
  });

  return [log];
}

async function onComplaintRegistered(grievance) {
  const userLogs = await notifyUserLifecycle({
    grievance,
    notificationType: "COMPLAINT_REGISTERED"
  });

  const adminLogs = await notifyAdminUrgentChannels(grievance);
  return [...userLogs, ...adminLogs];
}

async function onStatusUpdated({ previousStatus, previousDepartment, grievance }) {
  const logs = [];
  let eventType = null;

  if (previousStatus !== grievance.currentStatus) {
    if (grievance.currentStatus === "Under Review") {
      eventType = "UNDER_REVIEW";
    } else if (grievance.currentStatus === "Investigation") {
      eventType = "IN_PROCESS";
    } else if (grievance.currentStatus === "Resolved") {
      eventType = "RESOLVED";
    }
  }

  if (!eventType && previousDepartment !== grievance.department && grievance.department) {
    eventType = "IN_PROCESS";
  }

  if (eventType) {
    const userLogs = await notifyUserLifecycle({ grievance, notificationType: eventType });
    logs.push(...userLogs);
  }

  if (["High", "Critical"].includes(grievance.priority) && previousStatus !== grievance.currentStatus) {
    const adminLogs = await notifyAdminUrgentChannels(grievance);
    logs.push(...adminLogs);
  }

  return logs;
}

module.exports = {
  onComplaintRegistered,
  onStatusUpdated
};
