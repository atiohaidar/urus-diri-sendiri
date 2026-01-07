#!/bin/bash

# Set Java Home explicitly to valid JDK 21
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH

# Set Android SDK location
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export ANDROID_HOME=$ANDROID_SDK_ROOT
export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin

# Verify SDK is found
if [ ! -d "$ANDROID_SDK_ROOT" ]; then
    echo "Error: Android SDK not found at $ANDROID_SDK_ROOT"
    exit 1
fi

echo "Android SDK found at: $ANDROID_SDK_ROOT"

# Clear Gradle daemon to avoid toolchain issues
echo "Stopping existing Gradle daemons..."
cd android && ./gradlew --stop && cd ..

# Run the build and deployment process
echo "Building project..."
npm run build

echo "Syncing Capacitor..."
npx cap sync

echo "Deploying to Android..."
# Attempt to run on the specific target from jalankan.bat, falling back to default selection if that fails or isn't desired
if [ -z "$1" ]; then
    # Default to the target in .bat if no argument provided, or just run 'cap run android' which prompts if ambiguous
    # Using the specific target from jalankan.bat to be consistent
    npx cap run android --target 3466762590000MN
else
    # Allow passing a different target or arguments
    npx cap run android "$@"
fi
