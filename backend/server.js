require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { connectDB } = require("./connection");
const mongouri = process.env.MONGO_URI;
const userRouter = require("./routers/user");
const grievanceRouter = require("./routers/grievance");
// const twitterRouter = require("./routers/twitter");
const escalationRouter = require("./routers/escalation");
const duplicateDetectionRouter = require("./routers/duplicateDetection");
const { autoEscalateGrievances } = require("./services/escalationEngine");
const socialListenerRouter = require("./routers/socialListener");
const { startSocialComplaintListener } = require("./services/socialComplaintListener");
// const { startTwitterPolling } = require("./services/realTwitterScraper");
const cookieParser = require("cookie-parser");
const { MongoClient, GridFSBucket } = require("mongodb");
const multer = require("multer");
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cookieParser());
app.use(cors({
    origin: true,
    credentials: true,
    optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
connectDB(mongouri);
let bucket;
mongoose.connection.once("open", () => {
    bucket = new GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
    console.log("✅ GridFSBucket initialized!");
    console.log("✅ Gemini API Key loaded:", process.env.GEMINI_API_KEY ? "Yes" : "No");
    if (process.env.GEMINI_API_KEY) {
        console.log("   Using Gemini 2.5 Flash (Free) model");
    }
});
const storage = multer.memoryStorage();
const upload = multer({ storage });
app.post("/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    try {
        const uploadStream = bucket.openUploadStream(req.file.originalname);
        uploadStream.end(req.file.buffer);
        uploadStream.on("finish", () => {
            console.log("✅ File uploaded:", req.file.originalname);
            res.status(201).json({ message: "File uploaded successfully", filename: req.file.originalname });
        });
        uploadStream.on("error", (err) => {
            console.error("❌ Upload error:", err);
            res.status(500).json({ error: "File upload failed" });
        });
    } catch (err) {
        console.error("❌ Error uploading file:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.get("/file/:filename", async (req, res) => {
    try {
        console.log("🔍 Searching for file:", req.params.filename);
        const file = await mongoose.connection.db.collection("uploads.files").findOne({ filename: req.params.filename });
        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }
        const ext = req.params.filename.split('.').pop().toLowerCase();
        const contentTypes = {
            'pdf': 'application/pdf',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp'
        };
        const contentType = contentTypes[ext] || 'application/octet-stream';
        res.set("Content-Type", contentType);
        res.set("Content-Disposition", `inline; filename="${file.filename}"`);
        const downloadStream = bucket.openDownloadStream(file._id);
        downloadStream.pipe(res);
    } catch (err) {
        console.error("❌ Error retrieving file:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.get("/download/:filename", async (req, res) => {
    try {
        const file = await mongoose.connection.db.collection("uploads.files").findOne({ filename: req.params.filename });
        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }
        const ext = req.params.filename.split('.').pop().toLowerCase();
        const contentTypes = {
            'pdf': 'application/pdf',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp'
        };
        const contentType = contentTypes[ext] || 'application/octet-stream';
        res.set("Content-Type", contentType);
        res.set("Content-Disposition", `attachment; filename="${file.filename}"`);
        const downloadStream = bucket.openDownloadStream(file._id);
        downloadStream.pipe(res);
        console.log("📥 File sent for download:", req.params.filename);
    } catch (err) {
        console.error("❌ Error downloading file:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
app.use("/user", userRouter);
app.use("/grievance", grievanceRouter);
// app.use("/twitter", twitterRouter);
app.use("/escalation", escalationRouter);
app.use("/duplicate-detection", duplicateDetectionRouter);
app.use("/social-listener", socialListenerRouter);
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log('🚀 Escalation engine started. Checking every 1 minute for critical cases...');
    autoEscalateGrievances();
    setInterval(autoEscalateGrievances, 1 * 60 * 1000);

    console.log('📡 Starting social complaint listener...');
    startSocialComplaintListener({
        intervalMinutes: Number(process.env.SOCIAL_SCAN_INTERVAL_MINUTES || 3)
    });
    
    // Twitter integration temporarily disabled
    // console.log('\n🐦 Initializing Twitter Integration with authentication...');
    // startTwitterPolling(2);
    // console.log('✅ Twitter scraping active!\n');
});