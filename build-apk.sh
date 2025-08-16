#!/bin/bash

echo "Starting APK build process..."
echo "This may take 10-15 minutes for first build..."

cd android

# Set Android environment
export ANDROID_HOME=/data/data/com.termux/files/usr/opt/android-sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Clean previous build
echo "Cleaning previous build..."
./gradlew clean

# Build the APK
echo "Building APK..."
./gradlew assembleDebug

if [ $? -eq 0 ]; then
    echo "✅ APK built successfully!"
    echo "APK location: android/app/build/outputs/apk/debug/app-debug.apk"
    ls -la app/build/outputs/apk/debug/
else
    echo "❌ Build failed"
    exit 1
fi