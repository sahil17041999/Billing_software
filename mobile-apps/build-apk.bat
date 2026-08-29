@echo off
title Grocery POS - Android APK Builder
color 0b

echo ========================================================
echo        GROCERY POS & BILLING ERP - APK BUILD TOOL
echo ========================================================
echo.

set ANDROID_DIR=%~dp0android
cd /d "%ANDROID_DIR%"

echo [1/3] Checking Android Build Environment...
where javac >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [NOTE] Java JDK / Android SDK not found in system PATH.
    echo.
    echo To build APK manually:
    echo 1. Open Android Studio
    echo 2. Click "Open" and select folder:
    echo    %ANDROID_DIR%
    echo 3. Click: Build -^> Build Bundle(s) / APK(s) -^> Build APK(s)
    echo 4. Your installable APK will be created in:
    echo    %ANDROID_DIR%\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo ========================================================
    echo OR USE 1-CLICK INSTANT WEB-APK (No install needed):
    echo 1. Open Chrome on your Android mobile phone
    echo 2. Go to your app URL: http://192.168.84.103:3000
    echo 3. Tap Chrome Menu (3 dots) -^> "Install app"
    echo ========================================================
    echo.
    pause
    exit /b 0
)

echo [2/3] Building Android Debug APK...
if exist gradlew.bat (
    call gradlew.bat assembleDebug
) else (
    echo Gradle wrapper not initialized. Open in Android Studio to build.
)

if exist "%ANDROID_DIR%\app\build\outputs\apk\debug\app-debug.apk" (
    echo.
    echo ========================================================
    echo   SUCCESS! APK BUILT SUCCESSFULLY!
    echo ========================================================
    echo APK Location:
    echo %ANDROID_DIR%\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo You can now copy this APK to any Android phone and install it!
) else (
    echo.
    echo Project ready for Android Studio! Open the "android" folder in Android Studio.
)

echo.
pause
