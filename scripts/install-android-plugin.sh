#!/usr/bin/env bash
set -e

echo "=== Installing Capacitor Android Audio Plugin (NacAudio) ==="

ANDROID_DIR="android"
PLUGIN_SRC_DIR="plugins/capacitor-android-audio/src"
TARGET_PKG_DIR="android/app/src/main/java/com/nac/choir/plugin"
MANIFEST_FILE="android/app/src/main/AndroidManifest.xml"
BUILD_GRADLE="android/app/build.gradle"
MAIN_ACTIVITY="android/app/src/main/java/com/nac/choir/MainActivity.kt"

# 1. Check if android directory exists
if [ ! -d "$ANDROID_DIR" ]; then
    echo "Warning: android/ folder not found. Running 'npx cap add android'..."
    npx cap add android || true
fi

# 2. Create package directories
mkdir -p "$TARGET_PKG_DIR/audio"

# 3. Copy Kotlin plugin files
if [ -f "$PLUGIN_SRC_DIR/audio/AudioPlaybackService.kt" ]; then
    cp "$PLUGIN_SRC_DIR/audio/AudioPlaybackService.kt" "$TARGET_PKG_DIR/audio/AudioPlaybackService.kt"
    echo "✓ Copied AudioPlaybackService.kt"
else
    echo "Error: $PLUGIN_SRC_DIR/audio/AudioPlaybackService.kt not found!"
    exit 1
fi

if [ -f "$PLUGIN_SRC_DIR/CapacitorAudioPlugin.kt" ]; then
    cp "$PLUGIN_SRC_DIR/CapacitorAudioPlugin.kt" "$TARGET_PKG_DIR/CapacitorAudioPlugin.kt"
    echo "✓ Copied CapacitorAudioPlugin.kt"
else
    echo "Error: $PLUGIN_SRC_DIR/CapacitorAudioPlugin.kt not found!"
    exit 1
fi

# 4. Inject ExoPlayer 2.19.1 dependency if missing in app/build.gradle
if [ -f "$BUILD_GRADLE" ]; then
    if ! grep -q "com.google.android.exoplayer:exoplayer" "$BUILD_GRADLE"; then
        echo "Injecting ExoPlayer 2.19.1 dependency into $BUILD_GRADLE..."
        sed -i.bak '/dependencies {/a \    implementation '\''com.google.android.exoplayer:exoplayer:2.19.1'\''\' "$BUILD_GRADLE" || true
        rm -f "$BUILD_GRADLE.bak"
    fi
    echo "✓ Verified ExoPlayer dependency in $BUILD_GRADLE"
fi

# 5. Inject permissions & foreground service in AndroidManifest.xml
if [ -f "$MANIFEST_FILE" ]; then
    # Inject permissions if missing
    for PERM in "android.permission.INTERNET" "android.permission.FOREGROUND_SERVICE" "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK"; do
        if ! grep -q "$PERM" "$MANIFEST_FILE"; then
            sed -i.bak "/<manifest/a \    <uses-permission android:name=\"$PERM\" \/>" "$MANIFEST_FILE" || true
            rm -f "$MANIFEST_FILE.bak"
        fi
    done

    # Inject AudioPlaybackService declaration if missing
    if ! grep -q "AudioPlaybackService" "$MANIFEST_FILE"; then
        sed -i.bak '/<\/application>/i \        <service android:name="com.nac.choir.plugin.audio.AudioPlaybackService" android:foregroundServiceType="mediaPlayback" android:exported="false" \/>\' "$MANIFEST_FILE" || true
        rm -f "$MANIFEST_FILE.bak"
    fi
    echo "✓ Verified AndroidManifest.xml permissions and service declaration"
fi

# 6. Register CapacitorAudioPlugin in MainActivity.kt
if [ -f "$MAIN_ACTIVITY" ]; then
    if ! grep -q "CapacitorAudioPlugin" "$MAIN_ACTIVITY"; then
        echo "Registering CapacitorAudioPlugin in $MAIN_ACTIVITY..."
        if grep -q "registerPlugin" "$MAIN_ACTIVITY"; then
            sed -i.bak '/registerPlugin/a \        registerPlugin(com.nac.choir.plugin.CapacitorAudioPlugin::class.java)' "$MAIN_ACTIVITY" || true
        elif grep -q "super.onCreate" "$MAIN_ACTIVITY"; then
            sed -i.bak '/super.onCreate/a \        registerPlugin(com.nac.choir.plugin.CapacitorAudioPlugin::class.java)' "$MAIN_ACTIVITY" || true
        fi
        rm -f "$MAIN_ACTIVITY.bak"
    fi
    echo "✓ Verified MainActivity.kt plugin registration"
fi

echo "=== Plugin Installation Completed Successfully ==="
