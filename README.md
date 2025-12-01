# Internship Management Portal - TCE CSBS

A comprehensive web application for managing student internships, verifying credits, and generating reports for the Department of Computer Science and Business Systems, Thiagarajar College of Engineering.

## 🎯 Features

### 1. Student Portal
*   **Registration & Login**: Secure signup restricted to `@student.tce.edu` email domain
*   **Welcome Email**: Automated email upon successful registration with TCE contact details
*   **Internship Submission**:
    *   Company Name
    *   Description
    *   Duration (From/To dates)
    *   Mode (Online/Offline)
    *   **File Uploads**: Certificate (required), PPT, Report, Photo Proof
*   **Confirmation Email**: Sent immediately after successful submission
*   **Credit Tracking**: Real-time progress bar showing credits earned (3 required)
*   **Credit Alert**: Automatic email if credits < 3 when logging in
*   **Submission History**: View all past submissions with status

### 2. Proctor Portal
*   **Login**: Dedicated faculty access
*   **Assigned Students**: View students from their department
*   **Review Submissions**: 
    *   View all internship details
    *   Download/view all uploaded files (Certificate, PPT, Report, Photo)
*   **Approve/Reject**: 
    *   Approve internships (automatically adds 1 credit to student)
    *   Reject with reason
*   **Email Notifications**: Automatic approval/rejection emails sent to students

### 3. Admin Portal
*   **Login**: Centralized management
*   **Dashboard Statistics**:
    *   Total Students
    *   Total Internships
    *   Pending/Approved Internships
    *   Students with 3+ Credits (Completed)
    *   Students with < 3 Credits (Pending)
*   **Visual Charts**: Pie chart for Online/Offline internship distribution
*   **Export Data**: Download all internship data as CSV
*   **View All**: Complete list of students and internships

### 4. Public Home Page
*   **Year-wise Display**: Shows approved internships organized by year (1st, 2nd, 3rd, 4th)
*   **Internship Cards**: Each card displays:
    *   Student Name
    *   Register Number
    *   Company Name
    *   Duration
    *   Mode (Online/Offline)
    *   Status: ✔ Approved
*   **TCE Branding**: College colors (#830000) and imagery
*   **Contact Information**: TCE address, phone, website

## 📧 Email Notifications

All emails include TCE branding and contact information:

1.  **Registration**: Welcome email with login details
2.  **Submission**: Confirmation email after internship submission
3.  **Approval**: Congratulations email with credit update
4.  **Rejection**: Email with reason for rejection
5.  **Credit Alert**: Warning email if credits < 3

## 🛠️ Tech Stack
*   **Frontend**: React.js, Vite, Framer Motion, Recharts, Lucide React
*   **Backend**: Node.js, Express.js, MongoDB (Mongoose)
*   **Authentication**: JWT, bcrypt
*   **Email**: Nodemailer (Gmail SMTP)
*   **File Upload**: Multer (Local storage in `/uploads`)

## 📋 Prerequisites
*   Node.js (v14+)
*   MongoDB (Local or Atlas)
*   Gmail account (for email notifications)

## 🚀 Installation & Setup

### 1. Clone/Download the Project
```bash
cd "C:/Users/gideonsamuel/New folder (10)"
```

### 2. Backend Setup
```bash
cd backend
npm install
```

**Configure Environment Variables:**
Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/internship_portal
JWT_SECRET=your_secret_key_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password
```

> **Important**: For email notifications to work, you must:
> 1. Use a Gmail account
> 2. Enable 2-Factor Authentication
> 3. Generate an App Password (Google Account → Security → App Passwords)
> 4. Use the App Password in `EMAIL_PASS`

**Seed Database** (Creates default accounts):
```bash
node seed.js
```

This creates:
*   **Admin**: `admin@portal.com` / `adminpassword`
*   **Proctor**: `proctor@portal.com` / `proctorpassword`
*   **Student**: `student@student.tce.edu` / `studentpassword`

**Start Backend Server:**
```bash
npm start
```
Server runs on `http://localhost:5000`

### 3. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
App runs on `http://localhost:5173`

### 4. One-Click Run (Windows)
Double-click `run_project.bat` in the root directory to start both servers automatically.

## 📱 Usage Guide

### For Students:
1.  Go to `http://localhost:5173/signup`
2.  Register with `@student.tce.edu` email
3.  Check your email for welcome message
4.  Login and submit internship details with all files
5.  Track your credit progress on the dashboard
6.  Receive email notifications for approval/rejection

### For Proctors:
1.  Login with proctor credentials
2.  View assigned students' submissions
3.  Click "View" to download/verify uploaded files
4.  Approve or Reject internships
5.  Students receive automatic email notifications

### For Admins:
1.  Login with admin credentials
2.  View comprehensive statistics
3.  Monitor credit completion rates
4.  Export data to CSV for reports
5.  View all internships and students

## 📂 File Storage
*   All uploaded files are stored in `backend/uploads/`
*   Supported formats: PDF, PPT, PPTX, JPG, PNG
*   Only file paths are stored in MongoDB

## 🎨 Branding
*   **Primary Color**: #830000 (TCE Red)
*   **Logo**: TCE header banner
*   **Background**: TCE building image
*   **Font**: Inter (Google Fonts)

## 📞 Contact Information
**Thiagarajar College of Engineering**  
Madurai - 625 015  
Tamil Nadu, India  
📞 +91 452 2482240  
🌐 www.tce.edu

## 🔐 Default Credentials

| Role    | Email                      | Password         |
|---------|----------------------------|------------------|
| Admin   | admin@portal.com           | adminpassword    |
| Proctor | proctor@portal.com         | proctorpassword  |
| Student | student@student.tce.edu    | studentpassword  |

## 🐛 Troubleshooting

**Login Failed:**
*   Ensure you ran `node seed.js` in the backend folder
*   Check MongoDB is running

**Email Not Sending:**
*   Verify `EMAIL_USER` and `EMAIL_PASS` in `.env`
*   Use Gmail App Password, not regular password
*   Check internet connection

**File Upload Error:**
*   Ensure `backend/uploads` folder exists (auto-created)
*   Check file size (default limit: 10MB)

**"No approved internships":**
*   This is normal for a fresh database
*   Login as Proctor and approve a student's submission

## 📝 Notes
*   Students must use `@student.tce.edu` email to register
*   Each approved internship = 1 credit
*   Students need 3 credits before 5th semester
*   Credit alerts are sent automatically on login
*   All emails include TCE contact information

## 🎓 Developed For⚠️ 
Department of Computer Science and Business Systems  
Thiagarajar College of Engineering, Madurai
