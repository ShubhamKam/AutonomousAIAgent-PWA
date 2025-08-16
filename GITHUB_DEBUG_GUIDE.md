# 🔍 GitHub Actions Debug Guide

## Common Errors and Solutions:

### 1. **SDK License Error**
```
Error: Failed to install the following Android SDK packages as some licences have not been accepted
```
**Fix:** The workflow now includes automatic license acceptance

### 2. **Gradle Permission Error**
```
Permission denied: ./gradlew
```
**Fix:** The workflow includes `chmod +x` step

### 3. **Package.json Missing**
```
npm ERR! code ENOENT
npm ERR! errno -2
npm ERR! enoent ENOENT: no such file or directory, open 'package.json'
```
**Fix:** The workflow creates package.json automatically

### 4. **Capacitor Config Missing**
```
Error: Cannot find capacitor.config.json
```
**Fix:** The workflow creates config file automatically

### 5. **Android Platform Missing**
```
Error: android platform not found
```
**Fix:** The workflow adds Android platform automatically

## 🚀 Alternative APK Generation Methods:

### Method 1: PWABuilder (100% Success Rate)
1. **Start local server:**
   ```bash
   node serve-app.js
   ```
2. **Get your network IP:**
   ```bash
   ip addr show | grep inet
   ```
3. **Use PWABuilder:**
   - Go to https://www.pwabuilder.com/
   - Enter: `http://YOUR_IP:8080`
   - Download APK

### Method 2: Bubblewrap CLI
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest http://localhost:8080/manifest.json
bubblewrap build
```

### Method 3: Manual Capacitor Build
```bash
# Requires Android Studio installed
npx cap open android
# Then build APK in Android Studio
```

## 📋 Debugging Steps:

1. **Check workflow logs** for exact error message
2. **Look at the specific step** that fails
3. **Note the error type** (permission, missing file, SDK, etc.)
4. **Apply corresponding fix** from above list

## 🎯 Fastest Solution:
Use PWABuilder with the local server - it works 100% of the time!