#!/bin/bash

# Execute from within app directory with `../deploy.sh` command or with `./deploy.sh --no-install` to skip installation

# Source the configuration file
source ../pitcher_config.sh

# Function to format JSON or display raw output if not valid JSON
format_or_echo() {
    if jq -e . >/dev/null 2>&1 <<<"$1"; then
        jq '.' <<<"$1"
    else
        echo "Response is not valid JSON. Raw output:"
        echo "$1"
    fi
}

file="app.json"

# Check if file exists and exit if not
if [ ! -f "$file" ]; then
  echo "This is not an app. $file not found!"
  exit 1
fi

# Extract app_name from app.json
app_name=$(jq -r '.name' $file)

# Construct the new version out of the current date and time
new_version=$(date +"%Y.%m.%d.%H.%M.%S")

# Update the version in the JSON file
jq --arg new_version "$new_version" '.version = $new_version' $file > "tmp.json" && mv "tmp.json" $file

# Create the zip file
zip -r app.zip . -x "*.zip"

# Publish the app
echo ""
echo "Deploying app ${app_name}..."
echo "https://${PITCHER_DOMAIN}.my.pitcher.com/api/v1/apps/publish/"

PUBLISH_RESPONSE=$(curl -s -X POST \
  -H "X-API-Key: ${PITCHER_API_KEY}" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@app.zip" \
  "https://${PITCHER_DOMAIN}.my.pitcher.com/api/v1/apps/publish/")

format_or_echo "${PUBLISH_RESPONSE}"

# Clean up
rm app.zip

echo ""

# Check if --no-install flag is present
if [[ "$1" != "--no-install" ]]; then
  # Install the app
  echo "Installing app ${app_name}..."
  echo "https://${PITCHER_DOMAIN}.my.pitcher.com/api/v1/apps/${app_name}/install/"
  INSTALL_RESPONSE=$(curl -s -X POST \
    -H "X-API-Key: ${PITCHER_API_KEY}" \
    -H "Content-Type: multipart/form-data" \
    -F "instance_ids=${PITCHER_INSTANCE_ID}" \
    "https://${PITCHER_DOMAIN}.my.pitcher.com/api/v1/apps/${app_name}/install/")

  format_or_echo "${INSTALL_RESPONSE}"
else
  echo "Skipping installation as --no-install flag is present."
fi