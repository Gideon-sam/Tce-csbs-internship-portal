# Quick Start Guide - Finding the Student Dashboard Form

## The Form is NOT on the Home Page!

You need to navigate to the Student Dashboard after logging in.

## Steps to Access the Form:

1. **Login** at `http://localhost:5173/login`
   - Email: student@student.tce.edu
   - Password: studentpassword
   - Role: Student

2. **Click "Dashboard"** in the top navigation bar
   - Look for the navbar at the top
   - You'll see: Home | Dashboard | Logout
   - Click "Dashboard"

3. **You will see the form!**
   - Left side: "Submit Internship" form
   - Right side: "My Submissions" list

## The Form Contains:

- Company Name (text input)
- Description (textarea)
- Mode (dropdown: Online/Offline)
- From Date (date picker)
- To Date (date picker)
- Certificate Upload (required)
- PPT Upload (optional)
- Report Upload (optional)
- Photo Upload (optional)
- Submit Button

## Common Mistakes:

❌ Staying on the Home page (shows "Approved Internships")
❌ Not clicking "Dashboard" after login
❌ Using wrong credentials

✅ Login → Click "Dashboard" → See the form!

## If Form is Still Not Visible:

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Check browser console for errors (F12)
4. Verify you're logged in (navbar shows "Hi, [name]")
5. Verify URL is `/student/dashboard`
