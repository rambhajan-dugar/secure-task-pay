# iOS App Setup Guide for kaam.com

This guide will help you convert the kaam.com web app into a native iOS application.

## Prerequisites

1. **macOS** with Xcode installed (version 14.0 or later)
2. **Node.js** (v18 or later)
3. **Apple Developer Account** (for App Store submission)
4. **CocoaPods** (for iOS dependencies)

## Step 1: Install Dependencies

```bash
# Install Capacitor CLI globally
npm install -g @capacitor/cli

# Install iOS platform
npm install @capacitor/ios

# Add iOS platform to project
npx cap add ios
```

## Step 2: Build the Web App

```bash
# Build the production version
npm run build

# Sync with Capacitor
npx cap sync ios
```

## Step 3: Configure iOS Project

### App Icons
1. Open `ios/App/App/Assets.xcassets/AppIcon.appiconset`
2. Add your app icons in all required sizes:
   - 20x20 (1x, 2x, 3x)
   - 29x29 (1x, 2x, 3x)
   - 40x40 (1x, 2x, 3x)
   - 60x60 (2x, 3x)
   - 76x76 (1x, 2x)
   - 83.5x83.5 (2x)
   - 1024x1024 (App Store)

### Splash Screen
1. Open `ios/App/App/Assets.xcassets/Splash.imageset`
2. Add your splash screen images

### Info.plist Configuration
Add the following to `ios/App/App/Info.plist`:

```xml
<!-- Location permissions for SOS feature -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>kaam needs your location to provide safety features during in-person tasks</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>kaam needs background location access for the SOS safety feature during tasks</string>

<!-- Microphone for simulated emergency call -->
<key>NSMicrophoneUsageDescription</key>
<string>kaam may use the microphone during emergency SOS activation</string>

<!-- Camera for task submissions -->
<key>NSCameraUsageDescription</key>
<string>kaam needs camera access to capture photos for task submissions</string>

<!-- Photo library for attachments -->
<key>NSPhotoLibraryUsageDescription</key>
<string>kaam needs photo library access to attach images to task submissions</string>
```

## Step 4: Open in Xcode

```bash
npx cap open ios
```

This opens the iOS project in Xcode.

## Step 5: Configure Signing

1. In Xcode, select the **App** target
2. Go to **Signing & Capabilities**
3. Select your **Team** (Apple Developer account)
4. Choose a unique **Bundle Identifier** (e.g., `com.yourdomain.kaam`)

## Step 6: Add Capabilities

In Xcode, add these capabilities:
1. **Push Notifications** (for task notifications)
2. **Background Modes**:
   - Location updates (for SOS tracking)
   - Background fetch (for auto-release cron)

## Step 7: Test on Device

1. Connect your iPhone to your Mac
2. Select your device in Xcode
3. Click **Run** (⌘R)

## Step 8: Build for App Store

### Create Archive
1. Select **Generic iOS Device** or your connected device
2. Go to **Product → Archive**
3. Wait for archive to complete

### Submit to App Store Connect
1. Open **Window → Organizer**
2. Select your archive
3. Click **Distribute App**
4. Choose **App Store Connect**
5. Follow the prompts

## Updating the App

After making changes to the web app:

```bash
# Build web app
npm run build

# Sync with iOS
npx cap sync ios

# Copy web assets
npx cap copy ios

# Open Xcode
npx cap open ios
```

## Troubleshooting

### Common Issues

**Pod install fails:**
```bash
cd ios/App
pod install --repo-update
```

**Signing issues:**
- Ensure your Apple Developer account is active
- Check that your provisioning profile matches the bundle ID

**Location not working:**
- Verify Info.plist has location usage descriptions
- Check that location permission was granted in iOS Settings

**App crashes on launch:**
- Check Xcode console for error messages
- Ensure all required permissions are configured

## Native Plugin Usage

### Geolocation (for SOS)
```typescript
import { Geolocation } from '@capacitor/geolocation';

// Get current position
const position = await Geolocation.getCurrentPosition();

// Watch position (for real-time tracking)
const watchId = Geolocation.watchPosition(
  { enableHighAccuracy: true },
  (position) => {
    console.log(position);
  }
);
```

### Haptics (for SOS button)
```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Light impact
await Haptics.impact({ style: ImpactStyle.Light });

// Heavy impact (for SOS activation)
await Haptics.impact({ style: ImpactStyle.Heavy });

// Vibration pattern
await Haptics.vibrate({ duration: 500 });
```

## App Store Submission Checklist

- [ ] App icons in all sizes
- [ ] Splash screen configured
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Screenshots for all device sizes
- [ ] App description and keywords
- [ ] Age rating completed
- [ ] Export compliance answered
- [ ] All permissions have usage descriptions

## Support

For issues with the iOS build, check:
1. Capacitor documentation: https://capacitorjs.com/docs/ios
2. Project issues on GitHub
3. Contact support at support@kaam.com
