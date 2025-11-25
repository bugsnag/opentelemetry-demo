#!/usr/bin/env bash

set -e

### ------------------------------------------------------------
### Logging Helpers
### ------------------------------------------------------------
log_info() {
  echo -e "\033[1;34m[INFO]\033[0m $1"
}

log_success() {
  echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

log_error() {
  echo -e "\033[1;31m[ERROR]\033[0m $1"
}

log_step() {
  echo -e "\n\033[1;35m=== $1 ===\033[0m\n"
}

### ------------------------------------------------------------
### Android Build
### ------------------------------------------------------------
build_android() {
  log_step "Starting Android Build"

  log_info "Running npm install"
  npm i

  log_info "Running bundle install"
  bundle install

  log_info "Assembling Android release APK"
  ./gradlew assembleRelease

  log_info "Uploading APK"
  bundle exec upload-app \
    --farm=bs \
    --app=app/build/outputs/apk/release/app-release.apk \
    --app-id-file=bs-android-url.txt

  log_success "Android build completed!"
}

### ------------------------------------------------------------
### iOS Build
### ------------------------------------------------------------
build_ios() {
  log_step "Starting iOS Build"

  log_info "Running npm install"
  npm i

  log_info "Running bundle install"
  bundle install

  log_info "Running pod install"
  bundle exec pod install --repo-update

  log_info "Archiving iOS build"
  xcrun xcodebuild \
    DEVELOPMENT_TEAM=7W9PZ27Y5F \
    -workspace reactnativeapp.xcworkspace \
    -scheme reactnativeapp \
    -configuration Release \
    -allowProvisioningUpdates \
    archive \
    -archivePath "$(pwd)/reactnativeapp.xcarchive"

  log_info "Exporting IPA"
  xcrun xcodebuild \
    -exportArchive \
    -archivePath reactnativeapp.xcarchive \
    -exportPath output/ \
    -exportOptionsPlist ExportOptions.plist

  log_info "Uploading IPA"
  bundle exec upload-app \
    --farm=bs \
    --app=output/reactnativeapp.ipa \
    --app-id-file=bs-ios-url.txt

  log_success "iOS build completed!"
}

### ------------------------------------------------------------
### Script Entry
### ------------------------------------------------------------
if [ -z "$1" ]; then
  log_error "No platform specified."
  echo "Usage: ./build.sh [ios|android]"
  exit 1
fi

# Resolve directory of the script, regardless of where it's called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Go to the src/react-native-app directory (script is inside scripts/)
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "Running from: $ROOT_DIR"


case "$1" in
  android)
    cd "$ROOT_DIR/android" || { log_error "Android directory not found"; exit 1; }
    build_android
    ;;
  ios)
    cd "$ROOT_DIR/ios" || { log_error "iOS directory not found"; exit 1; }
    build_ios
    ;;
  *)
    log_error "Invalid platform: $1"
    echo "Usage: ./build.sh [ios|android]"
    exit 1
    ;;
esac
