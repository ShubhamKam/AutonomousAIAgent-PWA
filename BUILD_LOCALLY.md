# 🏠 Build Your Autonomous AI Agent APK Locally

If you want to build the APK yourself on your own machine, here's the complete guide:

## 📋 Prerequisites

### 1. Install Required Software
```bash
# Node.js 18+
# Download from: https://nodejs.org

# Java Development Kit 17
# Download from: https://adoptium.net

# Android Studio
# Download from: https://developer.android.com/studio
```

### 2. Set Environment Variables
```bash
# Add to your ~/.bashrc or ~/.zshrc:
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
export JAVA_HOME=/path/to/your/java17
```

## 🚀 Quick Build Method

### Option A: Using Our Repository
```bash
# 1. Clone the repository
git clone https://github.com/ShubhamKam/claudetest.git
cd claudetest/AutonomousAIAgent

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Fix any issues
npx react-native doctor

# 4. Build APK
cd android
chmod +x gradlew
./gradlew clean
./gradlew assembleDebug

# 5. Find your APK
ls -la app/build/outputs/apk/debug/app-debug.apk
```

### Option B: Create New Project (Recommended)
```bash
# 1. Create new React Native project
npx @react-native-community/cli@latest init AutonomousAIAgent

# 2. Navigate to project
cd AutonomousAIAgent

# 3. Replace App.tsx with our AI Agent code
# (Copy from COMPLETE_SOLUTION.md)

# 4. Install additional dependencies
npm install @react-native-async-storage/async-storage

# 5. Build APK
cd android
chmod +x gradlew
./gradlew assembleDebug
```

## 🔧 Troubleshooting Common Issues

### Issue 1: "SDK location not found"
```bash
# Create local.properties file
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
```

### Issue 2: "Command failed: gradlew assembleDebug"
```bash
# Check Java version
java -version
# Should be Java 17

# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug --info --stacktrace
```

### Issue 3: "Unable to load script from assets"
```bash
# Create assets directory and bundle
mkdir -p android/app/src/main/assets
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle
```

### Issue 4: "Metro bundler issues"
```bash
# Reset Metro cache
npx react-native start --reset-cache

# In another terminal
npx react-native run-android
```

## 📱 APK Signing (Optional)

For production APKs, sign them:

```bash
# Generate keystore
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Add to android/gradle.properties
echo "MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore" >> android/gradle.properties
echo "MYAPP_UPLOAD_KEY_ALIAS=my-key-alias" >> android/gradle.properties
echo "MYAPP_UPLOAD_STORE_PASSWORD=yourpassword" >> android/gradle.properties
echo "MYAPP_UPLOAD_KEY_PASSWORD=yourpassword" >> android/gradle.properties

# Build signed APK
./gradlew assembleRelease
```

## 🎯 Expected Results

After successful build:
- **APK Location:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **File Size:** ~15-25 MB
- **Install:** Transfer to Android device and install

## 🛠️ Alternative: Use Expo (Easier)

If React Native build is too complex:

```bash
# 1. Install Expo CLI
npm install -g @expo/cli

# 2. Create Expo project
npx create-expo-app AutonomousAIAgent --template blank-typescript

# 3. Add our AI Agent code
# (Copy from COMPLETE_SOLUTION.md)

# 4. Build APK using EAS
npx eas build --platform android --profile preview --local
```

## 🔍 Verification

Test your APK:
1. **Install on Android device**
2. **Open the app**
3. **Test chat functionality**
4. **Enter API key or use demo mode**
5. **Verify autonomous responses**

## 📞 Support

If you encounter issues:
1. **Check Java version:** `java -version` (should be 17)
2. **Check Android SDK:** `echo $ANDROID_HOME`
3. **Run doctor:** `npx react-native doctor`
4. **Clean project:** `./gradlew clean`
5. **Check logs:** `./gradlew assembleDebug --info`

## 🎉 Success!

Once built, you'll have a fully functional Autonomous AI Agent APK with:
- Real-time chat interface
- Autonomous response generation
- API key management
- Mobile-optimized UI
- Demo mode capability

**Your autonomous AI agent will be ready to bridge the gap between mind and action!** 🤖✨