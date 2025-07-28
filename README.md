# parserT - SMS Parser App

A React Native Android application that automatically listens to incoming SMS messages from specific senders (like M-PESA, banks, etc.), displays them in a clean UI, and uploads them to a remote server.

## Features

- **Automatic SMS Detection**: Listens to incoming SMS messages using Android BroadcastReceiver
- **Smart Filtering**: Only processes messages from whitelisted senders (M-PESA, Safaricom, Banks, etc.)
- **Automatic Upload**: Uploads SMS messages to a configurable remote server endpoint
- **Clean UI**: Displays messages in a user-friendly list with upload status indicators
- **Retry Mechanism**: Manual retry for failed uploads with detailed error logging
- **Permission Management**: Handles SMS permissions with clear user prompts
- **Settings Panel**: Configure server URL and view upload logs

## Requirements

- React Native 0.80.2+
- Android API Level 23+ (Android 6.0+)
- Node.js 16+
- Android SDK and development environment

## Permissions

The app requires the following Android permissions:

- `RECEIVE_SMS`: To listen for incoming SMS messages
- `READ_SMS`: To read SMS message content
- `INTERNET`: To upload messages to the remote server

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure Android development environment is set up
4. Run the app:
   ```bash
   npx react-native run-android
   ```

## Configuration

### Server Setup

1. Open the app and tap the settings icon (⚙️)
2. Configure your server URL (default: http://192.168.1.100:8000)
3. Save the configuration

### Server Endpoint

The app sends POST requests to `{server_url}/upload-sms` with the following JSON payload:

```json
{
  "sender": "M-PESA",
  "body": "TGQ4MG8ZOE Confirmed...",
  "timestamp": 1722002760000
}
```

## Whitelisted Senders

The app automatically filters messages from these senders:

- M-PESA, MPESA
- Safaricom
- IM-BANK, I&M BANK
- EQUITY
- KCB
- COOP BANK
- STANCHART
- ABSA
- DTB
- FAMILY BANK
- SID
- TALA

## Architecture

### Native Android Components

- **SMSReceiver.java**: BroadcastReceiver for intercepting SMS messages
- **SMSModule.java**: Native module for permission handling
- **SMSPackage.java**: React Native package registration

### React Native Components

- **App.tsx**: Main application component
- **MessageItem.tsx**: Individual message display component
- **SettingsScreen.tsx**: Configuration and logs interface
- **useSMS.ts**: Custom hooks for SMS functionality
- **SMSService.ts**: Service layer for API calls and data persistence

## Development

### File Structure

```
src/
├── components/
│   ├── MessageItem.tsx
│   └── SettingsScreen.tsx
├── hooks/
│   └── useSMS.ts
├── services/
│   └── SMSService.ts
└── types/
    └── index.ts
```

### Build Commands

```bash
# Android development build
npx react-native run-android

# Release build
cd android && ./gradlew assembleRelease
```

## Troubleshooting

### Permissions Issues

- Ensure the app has been granted SMS permissions in Android settings
- Check that the device is running Android 6.0+ for runtime permissions

### Network Issues

- Verify the server URL is correct and accessible
- Check that the server endpoint accepts POST requests
- Ensure the device and server are on the same network

### SMS Not Detected

- Verify the sender name matches the whitelist patterns
- Check Android logs for BroadcastReceiver activity
- Ensure the app is not being killed by battery optimization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on Android devices
5. Submit a pull request

## License

This project is licensed under the MIT License.

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
