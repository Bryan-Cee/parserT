# GitHub Actions APK Build Setup

This repository includes GitHub Actions workflows to automatically build Android APKs when you push to the main branch.

## Available Workflows

### 1. Development APK Builder (`build-dev-apk.yml`)
- **Trigger**: Push to main branch or pull requests
- **Output**: Debug and unsigned release APKs
- **Use case**: Development and testing
- **No setup required**: Works out of the box

### 2. Production APK Builder (`build-android.yml`)
- **Trigger**: Push to main branch or pull requests  
- **Output**: Signed release APK
- **Use case**: Production releases
- **Requires setup**: Signing keys needed (see below)

## How to Download APKs

1. Go to the **Actions** tab in your GitHub repository
2. Click on the latest workflow run
3. Scroll down to the **Artifacts** section
4. Download the APK files:
   - `parserT-debug-*`: Debug version with development features
   - `parserT-release-unsigned-*`: Optimized release version (unsigned)

## Setting Up Signed APKs (Optional)

For production-ready signed APKs, you need to set up signing keys:

### Step 1: Generate a Signing Key

```bash
# Generate a new keystore (do this locally)
keytool -genkey -v -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Convert keystore to base64 for GitHub secrets
base64 -i my-upload-key.keystore
```

### Step 2: Add GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions, and add:

- `SIGNING_KEY`: Base64-encoded keystore file
- `ALIAS`: Key alias (e.g., "my-key-alias")
- `KEY_STORE_PASSWORD`: Keystore password
- `KEY_PASSWORD`: Key password

### Step 3: Update Workflow

The `build-android.yml` workflow will automatically use these secrets to sign your APKs.

## APK Installation

### Debug APK
- Can be installed directly on any Android device with "Unknown sources" enabled
- Includes debugging features and logging

### Release APK (Unsigned)
- Optimized for performance
- Smaller file size
- Can be installed on development devices
- Not suitable for Play Store distribution

### Release APK (Signed)
- Ready for distribution
- Can be uploaded to Google Play Store
- Can be shared with users safely

## Troubleshooting

### Build Failures
- Check the Actions logs for detailed error messages
- Ensure all dependencies are properly listed in `package.json`
- Verify Android configuration in `android/app/build.gradle`

### Installation Issues
- Enable "Install unknown apps" in Android settings
- For signed APKs, ensure the signing certificate matches

### Performance
- Debug APKs are larger and slower than release builds
- Use release APKs for performance testing

## Development Workflow

1. **Development**: Use debug APKs for daily testing
2. **QA Testing**: Use unsigned release APKs for performance testing
3. **Production**: Use signed release APKs for distribution

## Security Notes

- Never commit signing keys to your repository
- Use GitHub secrets for sensitive information
- Regularly rotate signing keys for production apps
- Keep your keystore file secure and backed up
