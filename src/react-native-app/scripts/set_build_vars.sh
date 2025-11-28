#!/bin/sh

sed_in_place() {
    local script="$1"
    local file="$2"

    if [[ "$OSTYPE" == linux* ]]; then
        sed -i "$script" "$file"
    else
        sed -i '' "$script" "$file"
    fi
}

# Resolve directory of the script, regardless of where it's called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Go to the src/react-native-app directory (script is inside scripts/)
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
pushd "$ROOT_DIR"

echo "Running from: $ROOT_DIR"

sed_in_place "s/EXPO_PUBLIC_FRONTEND_PROXY_HOST=.*/EXPO_PUBLIC_FRONTEND_PROXY_HOST=${FRONTEND_PROXY_HOST}/" ".env"
sed_in_place "s/EXPO_PUBLIC_FRONTEND_PROXY_PORT=.*/EXPO_PUBLIC_FRONTEND_PROXY_PORT=${FRONTEND_PROXY_PORT}/" ".env"
sed_in_place "s/EXPO_PUBLIC_BUGSNAG_API_KEY=.*/EXPO_PUBLIC_BUGSNAG_API_KEY=${BUGSNAG_API_KEY}/" ".env"

popd