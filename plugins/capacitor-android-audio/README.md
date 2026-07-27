# Capacitor Android Background Audio Plugin (`NacAudio`)

A native Android plugin for **Capacitor 5.x** that uses a foreground Service and Google ExoPlayer (`2.20.0`) to keep audio playing seamlessly when the application is backgrounded or the screen is locked.

## Features

- **Foreground ExoPlayer Service**: Uses Android Foreground Service with notification controls (`MediaSession` / `MediaPlayback`) to prevent OS process killing.
- **Background Playback**: Continues audio playback when switching apps or locking screen.
- **Playback Controls**: Start, Play, Pause, Stop, Seek, and Get Status.
- **ExoPlayer 2.20.0 Integration**: High-performance audio streaming.

## Installation & Setup

### 1. Automatic Installation Script
Run the automated installation script from your project root:

```bash
chmod +x scripts/install-android-plugin.sh
./scripts/install-android-plugin.sh
```

This script automatically:
- Copies `AudioPlaybackService.kt` and `CapacitorAudioPlugin.kt` into `android/app/src/main/java/com/nac/choir/plugin/`
- Injects required Android permissions (`FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `INTERNET`) into `AndroidManifest.xml`
- Adds `com.google.android.exoplayer:exoplayer:2.20.0` to `android/app/build.gradle`
- Registers `CapacitorAudioPlugin` in `MainActivity.kt`

### 2. Manual Permissions (if required)
In `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:permission="android.permission.INTERNET" />
<uses-permission android:permission="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:permission="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />

<application ...>
    <service
        android:name="com.nac.choir.plugin.audio.AudioPlaybackService"
        android:foregroundServiceType="mediaPlayback"
        android:exported="false" />
</application>
```

### 3. ExoPlayer Dependency
In `android/app/build.gradle`:

```groovy
dependencies {
    implementation 'com.google.android.exoplayer:exoplayer:2.20.0'
}
```

## JS / TS API Usage

Import the TypeScript wrapper from `@/plugins/nac-audio`:

```typescript
import { nacAudio, startAudio, playAudio, pauseAudio, stopAudio, getAudioStatus } from '@/plugins/nac-audio';

// Start a background audio stream
await startAudio({
  url: 'https://example.com/stream.mp3',
  title: 'Choir Anthem #1',
  artist: 'NAC Choir',
  coverUrl: 'https://example.com/cover.jpg'
});

// Play / Pause / Stop
await playAudio();
await pauseAudio();
await stopAudio();

// Get status
const status = await getAudioStatus();
console.log('Playing:', status.isPlaying, 'Position:', status.currentPosition);
```

## Local Testing & Build Commands

```bash
# Build Web project
npm run build

# Sync Capacitor Android project
npx cap sync android

# Build Release APK via Gradle
cd android
./gradlew assembleRelease
```
