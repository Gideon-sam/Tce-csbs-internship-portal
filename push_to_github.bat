@echo off
echo ============================================
echo   TCE CSBS Internship Portal - GitHub Push
echo ============================================

cd /d "c:\Users\gideonsamuel\New folder (10)"

echo.
echo [1/4] Setting GitHub remote...
git remote remove origin 2>nul
git remote add origin https://github.com/Gideon-sam/TCE-CSBS-INTERNSHIP.git
echo Done.

echo.
echo [2/4] Staging all files...
git add .
echo Done.

echo.
echo [3/4] Committing...
git commit -m "Initial commit: TCE CSBS Internship Portal"
echo Done.

echo.
echo [4/4] Pushing to GitHub (main branch)...
git branch -M main
git push -u origin main

echo.
echo ============================================
echo   SUCCESS! Code pushed to GitHub.
echo   Now go to vercel.com to deploy.
echo ============================================
pause
