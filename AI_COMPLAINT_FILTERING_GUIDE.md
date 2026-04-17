# 🎯 AI-Powered Social Complaint Filtering - Quick Start Guide

## ✅ What You Now Have

A complete AI-powered system that **automatically validates social media complaints** and only shows **genuine help requests** to admins.

---

## 🚀 Quick Setup (3 Steps)

### **Step 1: Install Python Dependencies**
```bash
cd scripts
pip install -r requirements.txt
```

### **Step 2: Start Python API (New Terminal)**
```bash
cd scripts
python -m uvicorn api:app --host localhost --port 8000
```

### **Step 3: Restart Node.js Backend (New Terminal)**
```bash
cd backend
npm start
```

**That's it!** The system is now active.

---

## 🎬 How It Works

### **Automatic Filtering**:
1. **Social posts are fetched** from Twitter/Reddit
2. **Python AI analyzes** each post (5-10ms)
3. **Rejects spam/resolved** posts automatically
4. **Only valid complaints** → saved to database
5. **Admin dashboard** shows only verified complaints

### **Classification Types**:
| Type | Example | Action |
|------|---------|--------|
| ✅ HELP_REQUEST | "Please fix the broken streetlight" | **SAVED & SHOWN** |
| ℹ️ INFORMATIONAL | "The new traffic signs look good" | HIDDEN |
| 📋 RESOLVED | "Finally fixed! Thank you!" | HIDDEN |
| ❌ SPAM | "Buy this amazing product now!" | HIDDEN |

---

## 📊 Admin Dashboard Changes

### **Social Complaints Page** (`/social-complaints`)

**New AI Verification Column**:
```
┌─────────────────────────────────────────┐
│ AI Verification                         │
├─────────────────────────────────────────┤
│ 🟢 HELP_REQUEST                         │
│ Confidence: 87%                         │
│                                         │
│ 🔴 SPAM                                 │
│ Confidence: 92%                         │
│                                         │
│ 🔵 RESOLVED                             │
│ Confidence: 85%                         │
└─────────────────────────────────────────┘
```

**Only shows complaints with `isValidComplaint = true`**

---

## 💡 Real-World Examples

### **Example 1: Rural Complaint (AUTO-SAVED)**
```
Text: "Streetlight broken in Kharghar since 3 days. 
       Please fix urgently!"

AI Analysis:
  - Keywords: "broken", "please", "urgently" ✅
  - Sentiment: Negative (frustrated) ✅
  - Spam score: 0% ✅
  
Result: HELP_REQUEST (0.89 confidence)
→ ✅ SAVED & SHOWN to admin
```

### **Example 2: Promotional Post (AUTO-HIDDEN)**
```
Text: "Check our Summer Sale! Buy now with 50% off. 
       Limited stocks. Click here: www.site.com"

AI Analysis:
  - Keywords: "buy", "sale", "limited", "click" ❌
  - URLs detected ❌
  - Spam score: 92% ❌
  
Result: SPAM (0.92 confidence)
→ ❌ REJECTED & HIDDEN (not stored)
```

### **Example 3: Already Resolved (AUTO-HIDDEN)**
```
Text: "Thank you for fixing the pothole on MG Road! 
       Great work!"

AI Analysis:
  - Keywords: "thank you", "fixed", "great" ✨
  - Sentiment: Positive ✨
  - Help-seeking: NO ❌
  
Result: RESOLVED (0.85 confidence)
→ ❌ HIDDEN (not a new complaint)
```

---

## 🔍 What Gets Rejected

❌ **Automatically Rejected**:
- Posts with ads/promotions
- Already resolved complaints  
- Posts with excessive emojis/spam patterns
- Posts shorter than 5 characters
- Posts without complaint keywords

✅ **Automatically Accepted**:
- Posts asking for help
- Posts reporting problems
- Posts requesting government action
- Complaints from citizens (not general chatter)

---

## 📈 Monitor Performance

### **View Classification Stats**:
```bash
# Check Python API health
curl http://localhost:8000/

# Test classification
curl -X POST http://localhost:8000/classify-complaint \
  -H "Content-Type: application/json" \
  -d '{"text": "Please fix the broken streetlight", "min_confidence": 0.6}'
```

### **Check Database**:
```javascript
// Count valid complaints
db.grievances.countDocuments({ isValidComplaint: true })

// See classification breakdown
db.grievances.aggregate([
  { $group: { 
    _id: "$aiClassification", 
    count: { $sum: 1 } 
  }}
])

// Find any rejected SPAM
db.grievances.find({ 
  aiClassification: "SPAM", 
  aiConfidence: { $gt: 0.75 } 
}).count()
```

---

## 🎯 Admin Dashboard Usage

### **Navigate to Social Complaints**:
1. Go to `http://localhost:5174/clients`
2. Select your department
3. Click "Social Complaints" (sidebar)
4. View only **AI-verified complaints**

### **New Column Info**:
- Shows complaint type (HELP_REQUEST, SPAM, etc.)
- Shows confidence percentage (0-100%)
- Color-coded badges for quick recognition

### **Interpretation**:
| Badge Color | Meaning |
|------------|---------|
| 🟢 Green | Genuine complaint needing action |
| 🔴 Red | Spam (rejected, not shown) |
| 🔵 Blue | Already resolved |
| 🟡 Yellow | Just informational |

---

## ⚙️ Configuration

### **Adjust Confidence Thresholds** (in `backend/services/complaintClassifier.js`):
```javascript
// Higher = stricter filtering
const MIN_CONFIDENCE = 0.6;    // Default: 60%
const SPAM_THRESHOLD = 0.75;   // Reject spam if >75% confident
const RESOLVED_THRESHOLD = 0.8; // Reject resolved if >80% confident
```

**Recommendation**: Keep defaults unless you see issues

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Classification API unavailable" | Start Python API on port 8000 |
| No AI badge in dashboard | Restart backend (new complaints will have it) |
| Too many complaints rejected | Lower `MIN_CONFIDENCE` threshold |
| Spam getting through | Raise `SPAM_THRESHOLD` value |
| Empty social complaints list | Check if filtering is too strict |

---

## 📝 Next Steps

1. **Test with real data**:
   - Post a test complaint on social media
   - Watch it get auto-verified
   - See it appear in dashboard

2. **Monitor first few days**:
   - Check logs for classification accuracy
   - Adjust thresholds if needed
   - Give feedback to improve model

3. **Integrate other data sources**:
   - WhatsApp complaints
   - Email complaints
   - SMS complaints

4. **Expand to other departments**:
   - Create department-specific classifiers
   - Fine-tune keywords per domain

---

## 📞 Support

**Don't forget to**:
- ✅ Install Python requirements
- ✅ Start Python API on port 8000
- ✅ Restart Node.js backend
- ✅ Check `/` endpoint works
- ✅ Monitor logs for errors

---

## 🎉 You're All Set!

The system is now **actively filtering complaints** using AI. Admins will **only see genuine complaints** that need action, with **automatic classification** for each one.

**No more sorting through spam or off-topic posts!** 🚀
