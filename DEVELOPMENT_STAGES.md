# NagrikConnect-AI: 8-Stage Development Roadmap

## Project Overview
**NagrikConnect-AI** is an AI-powered grievance management system for Indian government departments. It enables citizens to file and track complaints, leveraging AI for automated categorization, escalation, and duplicate detection. The system also monitors social media platforms for public grievances.

---

## STAGE 1: Project Setup & Database Foundation

**Name:** Initial Setup with Core Database Models

**Files Added:**
- `backend/.env` - Environment configuration
- `backend/.gitignore` - Git ignore rules
- `backend/connection.js` - MongoDB connection utility
- `backend/models/user.js` - User schema
- `backend/models/grievance.js` - Grievance/complaint schema
- `backend/models/notificationLog.js` - Notification logging schema
- `backend/package.json` - Backend dependencies
- `client/package.json` - Frontend dependencies with React, Vite, React Router
- `client/public/index.html` - Basic HTML entry point
- `README.md` - Project documentation
- `start-all.bat`, `stop-all.bat` - Batch scripts for Windows
- `mongodb/` - Local MongoDB setup directory (optional)

**Files Modified:**
- None (fresh start)

**Changes:**
- Initialize Express.js server structure
- Setup MongoDB connection with Mongoose
- Create user schema with authentication fields (email, password hash, role, permissions)
- Create grievance base schema with essential fields (code, complainant info, department, status)
- Setup environment variables for database URI, port, API keys
- Configure CORS, body-parser, cookie-parser middleware
- Initialize Vite + React client with basic folder structure

**Commit Message:**
```
feat: Initialize NagrikConnect-AI project with backend, frontend, and MongoDB setup

- Setup Express.js server with MongoDB connection
- Create core models: User and Grievance schemas
- Initialize React frontend with Vite bundler
- Add environment configuration and middleware
- Setup project structure for team development
```

---

## STAGE 2: User Authentication & Authorization

**Name:** Authentication System with JWT & User Routes

**Files Added:**
- `backend/routers/user.js` - User authentication routes (register, login, logout, profile)
- `backend/middlewares/auth.js` - JWT authentication middleware
- `backend/services/` - Create directory
- `backend/start-all.bat`, `backend/stop-all.bat` - Server startup scripts
- `client/src/components/login.jsx` - Login form component
- `client/src/components/SignUp.jsx` - Registration form component
- `client/src/context/` - Create context directory for state management
- `client/src/utilities/` - Create utilities directory for API calls

**Files Modified:**
- `backend/server.js` - Add user router and auth middleware
- `backend/package.json` - Add bcryptjs, jsonwebtoken, dotenv dependencies

**Changes:**
- Implement user registration with password hashing (bcryptjs)
- Create JWT token generation and validation
- Add protected routes middleware for authenticated endpoints
- Create login/logout routes with cookie-based session management
- Build login and signup UI components in React
- Setup API utility functions for authentication requests
- Add CORS credentials support for cookie handling

**Commit Message:**
```
feat: Implement user authentication with JWT and protected routes

- Add bcryptjs password hashing and JWT token generation
- Create /user/register and /user/login routes
- Implement auth middleware for protecting routes
- Add login and signup React components
- Setup secure cookie-based session management
```

---

## STAGE 3: Grievance Filing & Core Complaint Management

**Name:** Complaint Filing System with CRUD Operations

**Files Added:**
- `backend/routers/grievance.js` - Grievance CRUD routes and API endpoints
- `backend/services/pdfGenerator.js` - PDF report generation service
- `client/src/components/GrievanceForm.jsx` - Complaint filing form
- `client/src/components/Complaints.jsx` - List complaints component
- `client/src/pages/GrievanceDetailPage.jsx` - Complaint detail view
- `client/src/App.jsx` - Route definitions for grievance pages
- `client/src/components/Header.jsx` - Navigation header
- `client/src/utilities/api.js` - API client for backend communication

**Files Modified:**
- `backend/server.js` - Register grievance router, add file upload endpoints
- `backend/models/grievance.js` - Refine schema (add categories, priority levels, status tracking)
- `backend/package.json` - Add pdfkit (PDF generation), multer (file uploads), gridfs-stream

**Changes:**
- Create REST API endpoints for grievance submission (POST /grievance)
- Implement grievance retrieval with filtering and pagination (GET /grievance)
- Add file upload functionality using GridFS for PDF/images
- Create grievance status tracking (Complaint Filed → Under Review → Resolved)
- Build complaint filing form with validation
- Implement complaint list view with search/filter
- Add complaint detail page showing full information
- Create automatic grievance code generation (UUID-based)

**Commit Message:**
```
feat: Add grievance filing and complaint management system

- Implement CRUD endpoints for complaint submission and tracking
- Add file upload with GridFS bucket storage
- Create grievance form component with validation
- Add complaint listing and detail pages
- Implement auto-generated grievance codes
- Add PDF generation for complaint reports
```

---

## STAGE 4: Frontend UI & User Experience

**Name:** Complete Frontend Interface with Pages & Components

**Files Added:**
- `client/src/pages/LandingPage.jsx` - Public landing/home page
- `client/src/pages/HomePage.jsx` - Authenticated user dashboard
- `client/src/pages/HowItWorksPage.jsx` - Instructions page
- `client/src/components/Home.jsx` - Status tracking component
- `client/src/components/Navbar.jsx` - Navigation bar
- `client/src/components/Sidebar.jsx` - Side navigation
- `client/src/components/Footer.jsx` - Footer component
- `client/src/components/FAQPage.jsx` - FAQ section
- `client/src/components/Services.jsx` - Services directory
- `client/src/components/Features.jsx` - Features showcase
- `client/src/components/Contact.jsx` - Contact form
- `client/src/translations/` - i18n configuration for multi-language support
- `client/src/components/LanguageSwitcher.jsx` - Language selection component
- `client/src/App.css`, `client/src/index.css` - Global styling
- `vite.config.js` - Vite React configuration
- `admin/` - Admin panel directory (basic structure)

**Files Modified:**
- `client/src/App.jsx` - Add all route definitions
- `client/src/main.jsx` - Setup React Router and providers
- `client/package.json` - Add react-router-dom, react-i18next, react-toastify

**Changes:**
- Create responsive landing page showcasing system features
- Build authenticated user dashboard with complaint statistics
- Design complaint submission flow with step-by-step forms
- Implement navigation and routing across all pages
- Add language switching for Hindi/English support
- Create FAQ section addressing common questions
- Add toast notifications for user feedback
- Implement responsive CSS for mobile and desktop
- Create services directory page describing complaint categories
- Add about/contact sections

**Commit Message:**
```
feat: Build complete frontend UI with responsive design and routing

- Create landing page with feature showcase
- Implement user dashboard and complaint tracking interface
- Add multi-language support (Hindi/English)
- Build responsive navigation and sidebar
- Add FAQ, services, and contact pages
- Implement toast notifications and routing
```

---

## STAGE 5: AI-Powered Intelligent Features

**Name:** Gemini API Integration for Smart Categorization & Analysis

**Files Added:**
- `backend/services/gemini.js` - Gemini API integration for AI features
- `backend/services/openai.js` - OpenAI API integration (fallback)
- `backend/routers/escalation.js` - Escalation routing logic
- `backend/services/escalationEngine.js` - Automated escalation service
- `backend/services/notificationEngine.js` - Notification dispatching
- `backend/models/notificationLog.js` - Notification tracking
- `backend/create-emergency-admin.js` - Admin creation script
- `backend/test-ai-categorization.js` - Testing utilities for AI features

**Files Modified:**
- `backend/server.js` - Add escalation router, start escalation engine on boot
- `backend/models/grievance.js` - Add AI-related fields (category, sentiment, priority, aiResolved, aiResolutionText)
- `backend/routers/grievance.js` - Integrate Gemini for auto-categorization
- `backend/package.json` - Add @google/generative-ai (Gemini), openai

**Changes:**
- Integrate Google Gemini API for automatic complaint categorization (Department, Category, Subcategory)
- Implement sentiment analysis to detect complaint urgency (Negative, Urgent, Critical)
- Create automatic priority assignment based on content analysis
- Implement escalation rules (Critical priority → auto-escalate to Emergency Response Team)
- Add escalation history tracking with timestamps
- Generate AI-suggested resolutions using Gemini
- Create notification engine for status updates and escalations
- Implement auto-escalation cron job (runs every minute)

**Commit Message:**
```
feat: Add AI-powered categorization and escalation system using Gemini API

- Integrate Google Gemini 2.5 Flash for intelligent categorization
- Implement automatic priority assignment and sentiment analysis
- Create auto-escalation engine for critical complaints
- Add notification system for status updates
- Build escalation history tracking
- Setup AI-generated resolution suggestions
```

---

## STAGE 6: Duplicate Detection & Advanced Analysis

**Name:** Duplicate Detection Engine with Similarity Analysis

**Files Added:**
- `backend/routers/duplicateDetection.js` - Duplicate detection API endpoints
- `backend/services/duplicateDetection.js` - ML-based duplicate detection logic
- `backend/services/pdfGenerator.js` - Enhanced PDF generation with full complaint details
- `backend/scripts/assign-duplicate-groups.js` - Batch processing script
- `backend/scripts/scan-existing-duplicates.js` - Database scanning utility
- `backend/scripts/check-electricity-duplicates.js` - Department-specific checking
- `backend/test-duplicate-detection.js` - Test suite
- `client/src/components/DuplicateWarning.jsx` - Duplicate warning UI component

**Files Modified:**
- `backend/server.js` - Add duplicate detection router
- `backend/models/grievance.js` - Add duplicate tracking fields (isDuplicate, linkedTo, duplicateGroup, similarityScore)
- `backend/routers/grievance.js` - Call duplicate detection on new submissions
- `backend/package.json` - Add string-similarity, natural language processing libraries

**Changes:**
- Implement string similarity algorithm for complaint matching
- Create duplicate detection triggered on new grievance submission
- Add complaint linking to group similar issues together
- Implement similarity scoring (0-100) with configurable threshold
- Create duplicate marking and manual linking capabilities
- Build UI warning when potential duplicates detected
- Add batch scanning script to find duplicates in existing complaints
- Implement department-specific duplicate detection (e.g., electricity bills)

**Commit Message:**
```
feat: Add duplicate detection engine and complaint linking system

- Implement ML-based similarity detection for duplicate complaints
- Create complaint grouping and linking functionality
- Add duplicate detection warnings on submission
- Build batch scanning utilities for existing complaints
- Implement configurable similarity thresholds
- Add manual duplicate linking interface
```

---

## STAGE 7: Social Media Integration & Public Monitoring

**Name:** Real-time Social Media Complaint Monitoring

**Files Added:**
- `backend/routers/socialListener.js` - Social media listening API routes
- `backend/routers/socialProof.js` - Social media evidence management routes
- `backend/services/socialComplaintListener.js` - Service for monitoring Twitter/Reddit/Instagram
- `backend/services/realTwitterScraper.js` - Twitter scraping with API authentication
- `backend/services/nitterScraperV2.js` - Nitter-based scraping (fallback)
- `backend/routers/twitter.js` - Twitter-specific endpoints
- `backend/models/socialComplaintEvidence.js` - Schema for social media evidence
- `backend/test-snscrape.py` - Python script for social scraping testing
- `backend/scripts/main.py` - Python social media monitoring script
- `backend/scripts/fastapi_app.py` - FastAPI service for social listening
- `backend/chatbot-server.js` - Telegram/chat integration
- `client/src/components/Chatbot.jsx` - Chatbot UI component

**Files Modified:**
- `backend/server.js` - Start social listener on boot
- `backend/models/grievance.js` - Add sourceMetadata fields (twitter, reddit, instagram)
- `backend/package.json` - Add @the-convocation/twitter-scraper, rss-parser, node-telegram-bot-api, axios
- `backend/services/duplicateDetection.js` - Cross-reference with social media complaints

**Changes:**
- Implement Twitter/X API scraping to detect mentioned complaints
- Setup Reddit API polling for complaint discussions
- Add Instagram hashtag monitoring for public reports
- Create automatic grievance creation from social media posts
- Implement proof-of-public-complaint feature (links to social posts)
- Add source attribution (shows original social media handle)
- Build Telegram bot for complaint notifications
- Create chatbot for interactive complaint filing
- Setup scheduled intervals (configurable) for social monitoring
- Add hashtag and keyword tracking

**Commit Message:**
```
feat: Add social media monitoring and public grievance detection

- Integrate Twitter, Reddit, and Instagram API scraping
- Create automatic grievance creation from social posts
- Add proof-of-public-complaint with source attribution
- Implement Telegram bot for notifications
- Build chatbot interface for complaint filing
- Setup real-time social media listening service
```

---

## STAGE 8: Admin Panel, Testing & Production Optimization

**Name:** Admin Dashboard, Report Generation, and System Optimization

**Files Added:**
- `admin/src/` - Admin panel React components and pages
- `admin/src/components/AdminDashboard.jsx` - Main admin interface
- `admin/src/components/GrievanceAnalytics.jsx` - Statistics and charts
- `admin/src/components/UserManagement.jsx` - User admin panel
- `admin/src/components/ModeratedComplaints.jsx` - Moderation interface
- `admin/src/pages/AdminHome.jsx` - Admin dashboard home
- `admin/vite.config.js` - Admin panel Vite config
- `admin/package.json` - Admin Dependencies
- `admin/src/App.jsx`, `admin/src/main.jsx`, `admin/src/index.css` - Admin setup
- `backend/test-critical-escalation.js` - Test suite for escalations
- `backend/test-escalation-system.js` - Integration tests
- `backend/cleanup-test-complaints.js` - Data cleanup utilities
- `backend/list-all-complaints.js` - Reporting script
- `backend/.env.example` - Environment template
- `SETUP.bat`, `SETUP-FIXED.bat` - Automated setup scripts
- `.gitignore` - Git exclusion rules

**Files Modified:**
- `backend/routes/grievance.js` - Add admin moderation endpoints
- `backend/routes/user.js` - Add user management endpoints for admins
- `backend/models/grievance.js` - Add moderationStatus and admin fields
- `backend/server.js` - Refine error handling, logging, health check endpoints
- `backend/package.json` - Add testing frameworks (jest, mocha)
- `client/src/components/ProfilePage.jsx` - User profile with admin access checks
- `client/src/components/AccountDetails.jsx` - Admin account settings
- `backend/services/pdfGenerator.js` - Enhanced PDF with analytics
- All files - Add comprehensive error handling and logging

**Changes:**
- Create admin dashboard showing system-wide statistics
- Implement complaint moderation interface (approve/reject/flag)
- Add analytics and reporting (complaint trends, department performance)
- Build user management admin panel
- Create complaint export/download functionality
- Implement comprehensive logging and auditing
- Add data cleanup utilities for test complaints
- Create automated setup and configuration scripts for deployment
- Add environment variable templates
- Implement health check endpoints
- Add comprehensive error handling and validation across all routes
- Create integration test suite
- Optimize database queries with indexing
- Add input validation and sanitization throughout
- Create production-ready configurations

**Commit Message:**
```
feat: Complete admin panel, testing suite, and production optimization

- Build comprehensive admin dashboard with analytics
- Add complaint moderation and user management interfaces
- Implement data export and reporting features
- Create integration tests and cleanup utilities
- Add environment configuration templates
- Optimize database queries and add input validation
- Setup automated deployment scripts
- Add health checking and comprehensive logging
```

---

## Implementation Notes

### Key Architectural Decisions:
1. **Modular Services Pattern** - Each major feature (AI, Notifications, Social Listening) is a separate service
2. **Separation of Concerns** - Routers → Services → Models
3. **GridFS Storage** - Use MongoDB GridFS for file storage instead of server filesystem
4. **Async Processing** - Escalation and social listening run asynchronously
5. **Multi-tenancy Ready** - Department-based access control and grouping

### Technology Stack:
- **Backend:** Express.js, Node.js
- **Frontend:** React, Vite, React Router, Axios
- **Database:** MongoDB with Mongoose ODM
- **AI/ML:** Google Gemini API, OpenAI (fallback)
- **External Services:** Twitter API, Reddit API, Telegram Bot API
- **File Storage:** GridFS (MongoDB)
- **Authentication:** JWT tokens with cookies
- **PDF Generation:** PDFKit

### Development Velocity:
- Stages 1-2: Infrastructure (~2 days)
- Stages 3-4: Core Features (~3-5 days)
- Stages 5-6: Intelligence Layer (~3-4 days)
- Stages 7-8: Integration & Polish (~4-5 days)
- **Total:** ~12-16 days for complete system

### Testing Strategy:
- Unit tests for business logic (services)
- Integration tests for API routes
- E2E tests for critical user flows
- Load testing for production readiness

### Deployment Checklist:
- Database backups and recovery procedures
- Environment variable configuration
- CORS and security headers setup
- Rate limiting on API endpoints
- Logging and monitoring setup
- Email/notification service configuration
