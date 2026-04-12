# NagrikConnect AI - Grievance Management System

A comprehensive AI-powered grievance management system for government departments in Maharashtra.

## 🆕 Latest Updates (March 2026)

### New Features:
- 🎤 **Voice-to-Text**: Speak your grievances in any Indian language
- 🌍 **10 Languages**: English, Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Punjabi
- 🤖 **Gemini AI**: Upgraded from Hugging Face to Google Gemini for better responses
- 📄 **AI Resolution PDF**: Automatic PDF generation for resolved grievances
- ✨ **Enhanced UI**: Modern, responsive design with animations

## Quick Start

### For New PC Setup:
1. Copy entire project folder to new PC
2. Double-click `SETUP.bat`
3. Choose option **[1] First Time Setup**
4. After setup completes, choose option **[2] Start All Services**

### For Daily Use:
1. Double-click `SETUP.bat`
2. Choose option **[2] Start All Services**
3. Access:
   - Client App: http://localhost:5173 (Chatbot with Voice Input)
   - Admin Panel: http://localhost:5174 (AI Resolution Generator)

## What You Need

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB Community Edition
- Google Gemini API Key (Already configured ✅)

## Admin Login Credentials

**⚠️ Test Credentials (For Demo/Development Only)**

See `ADMIN-CREDENTIALS.md` for all department logins.

Quick access:
- Email: `finance@maharashtragovt.com`
- Password: `admin123`

## Features

### Citizen Features:
- ✅ User registration and login
- ✅ Department-wise grievance submission
- 🎤 **NEW**: Voice-to-text input in 10 Indian languages
- 🌍 **NEW**: Multilanguage AI chatbot assistance
- ✅ Real-time grievance tracking
- ✅ PDF document upload
- ✅ GPS location tagging

### Admin Features:
- ✅ Department-wise grievance filtering
- ✅ AI spam detection
- 📄 **NEW**: One-click AI resolution with PDF generation
- ✅ AI-assisted resolution suggestions
- ✅ Q&A system with citizens
- ✅ Status tracking (4 stages)
- ✅ Document viewing and management

## Project Structure

```
NagrikConnect/
├── admin/              # Admin Panel (React + Vite)
├── backend/            # Backend Server (Node.js + Express)
│   └── services/       # NEW: Gemini AI & PDF Generator
├── client/             # Client App (React + Vite)
├── scripts/            # Python scripts (spam detection)
├── SETUP.bat          # All-in-one setup & management
├── start-all.bat      # Quick start (after first setup)
├── stop-all.bat       # Stop all services
├── GEMINI-SETUP.md    # NEW: Gemini API setup guide
├── QUICK-START-GUIDE.md  # NEW: Feature usage guide
└── ADMIN-CREDENTIALS.md  # Admin login details
```

**Note**: MongoDB folder will be created automatically during first-time setup.

## Tech Stack

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express + MongoDB
- **Database**: MongoDB (Local - no cloud)
- **AI**: Google Gemini Pro (Upgraded from Hugging Face) 🆕
- **Voice**: Web Speech API (Browser-based) 🆕
- **PDF**: PDFKit 🆕
- **Python**: Flask + scikit-learn (Spam Detection)

## 🎯 How to Use New Features

### For Citizens - Voice Input:
1. Open http://localhost:5173
2. Select your language from dropdown
3. Click microphone button 🎤
4. Speak your question
5. Click "Get Assistance"

### For Admins - AI Resolution:
1. Login to admin panel
2. Open any grievance
3. Click "Generate AI Resolution & PDF"
4. Download the generated PDF report

**📚 Detailed Guide**: See `QUICK-START-GUIDE.md`

## SETUP.bat Options

1. **First Time Setup** - Install dependencies, setup MongoDB, initialize database
2. **Start All Services** - Start MongoDB, Backend, Python API, Client, Admin
3. **Stop All Services** - Stop all running services
4. **View Database** - Open database viewer in browser
5. **Test Services** - Check which services are running
6. **Exit** - Close the setup tool

## Porting to Another PC

1. Copy entire project folder
2. Run `SETUP.bat` → Choose option [1]
3. MongoDB will be downloaded if not present
4. Database will be initialized with sample data
5. Gemini API key is already configured ✅
6. Start services with option [2]

## Manual Start (Alternative)

If you prefer manual control:

```bash
# Terminal 1 - MongoDB
cd mongodb/bin
mongod --dbpath ../data --logpath ../logs/mongodb.log

# Terminal 2 - Backend
cd backend
npm start

# Terminal 3 - Python Spam Detection
cd scripts
python -m uvicorn spamdetection_server:app --reload --port 8000

# Terminal 4 - Client
cd client
npm run dev

# Terminal 5 - Admin
cd admin
npm run dev
```

## Troubleshooting

**Voice input not working?**
- Use Chrome, Edge, or Safari browser
- Allow microphone permission when prompted
- Check browser console (F12) for errors

**AI not responding?**
- Check internet connection
- Verify Gemini API key in `backend/.env`
- Restart backend server

**MongoDB not found?**
- Download from: https://www.mongodb.com/try/download/community
- Extract and place `bin` folder inside `mongodb/` folder

**Services not starting?**
- Run `SETUP.bat` → Choose option [5] to test services
- Check if ports 5000, 5173, 5174, 8000, 27017 are available

**Database empty?**
- Run `SETUP.bat` → Choose option [4] to view database
- If empty, run option [1] again to reinitialize





## Copyright

Copyright © 2026 Maharashtra Government  
Last Updated: 01-03-2026

---

**🚀 Ready to use with all new features!**