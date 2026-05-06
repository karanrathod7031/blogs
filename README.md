# Blogs Platform (Production-Grade)

A high-performance technical writing playground built with React, Vite, and Firebase. Optimized for security, scale, and elite user experience.

## 🚀 Vision
This platform is designed to be more than just a blog; it's a technical archive optimized for engineers. It features a custom "Studio" for content management and a "Master Logic" admin panel for site governance.

## 🛠 Tech Stack
- **Frontend**: React 19 + Vite + Tailwind CSS
- **Motion**: motion/react for fluid transitions
- **Backend**: Firebase (Firestore, Auth, Security Rules)
- **AI**: Gemini Pro API for smart content generation
- **Architecture**: Domain-Driven Feature Structure + Service Layer Pattern

## ✨ Production Features
- **Centralized Service Layer**: Decoupled Firebase logic for better maintainability.
- **Hardened Security**: Multi-tier identity checks with email-verified enforcement.
- **Global Event Notifications**: Custom Toast system for real-time feedback.
- **System Telemetry**: Real-time admin dashboard with system activity visualization.
- **Responsive Engineering**: Mobile-first design with complex desktop-only bento layouts.
- **Optimized Queries**: Advanced Firestore querying with relational access control.

## 📋 Environment Variables
Create a `.env` file with the following keys:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_ID=(default)
GEMINI_API_KEY=your_gemini_key
```

## 🔐 Security Audit Results
- [x] Global Deny-All Safety Net
- [x] Email Verification required for Admin roles
- [x] Type-strict schema validation in Firestore rules
- [x] Identity spoofing protection (validated ownerId)
- [x] Protection against "Denial of Wallet" attacks via strict size limits

## 🛠 Development
1. `npm install` - Install dependencies
2. `npm run dev` - Start local development server
3. `npm run build` - Production build bundle
4. `npm run lint` - Type-check and lint code
