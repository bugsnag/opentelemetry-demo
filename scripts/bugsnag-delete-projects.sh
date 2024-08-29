#!/bin/bash

if ! command -v jq &>/dev/null; then
    echo "ERROR: jq is required to run this script. Please install it and try running the script again."
    exit 1
fi

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <organization_id> <api_key>"
    exit 1
fi

ORGANIZATION_ID=$1
API_KEY=$2

DELETE_PREFIX="bugsnag-otel-demo"

echo "WARNING: This script will delete all projects with names starting with \"${DELETE_PREFIX}\" in the organization with ID ${ORGANIZATION_ID}."
echo "WARNING: THIS OPERATION IS DESTRUCTIVE CANNOT BE UNDONE."
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborting."
    exit 1
fi

PROJECTS_RESPONSE=$(curl --silent --write-out "HTTPSTATUS:%{http_code}" --location --request GET "https://api.bugsnag.com/organizations/${ORGANIZATION_ID}/projects?q=${DELETE_PREFIX}&per_page=100" \
    --header "Authorization: token ${API_KEY}")

HTTP_BODY=$(echo "$PROJECTS_RESPONSE" | sed -e 's/HTTPSTATUS\:.*//g')
HTTP_STATUS=$(echo "$PROJECTS_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [[ "$HTTP_STATUS" -lt 200 || "$HTTP_STATUS" -ge 300 ]]; then
    echo "ERROR: Failed to list projects. HTTP status code: ${HTTP_STATUS}"
    echo "Response: $HTTP_BODY"
    exit 1
fi

PROJECT_IDS=($(echo "$HTTP_BODY" | jq -r '.[].id'))

echo "Found ${#PROJECT_IDS[@]} projects to delete."
read -p "Are you sure you want to delete these projects? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborting."
    exit 1
fi

for project_id in "${PROJECT_IDS[@]}"; do
    echo "Deleting project ${project_id}..."

    DELETE_RESPONSE=$(curl --silent --write-out "HTTPSTATUS:%{http_code}" --location --request DELETE "https://api.bugsnag.com/projects/${project_id}" \
        --header "Authorization: token ${API_KEY}")

    HTTP_BODY=$(echo "$DELETE_RESPONSE" | sed -e 's/HTTPSTATUS\:.*//g')
    HTTP_STATUS=$(echo "$DELETE_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

    if [[ "$HTTP_STATUS" -lt 200 || "$HTTP_STATUS" -ge 300 ]]; then
        echo "ERROR: Failed to delete project ${project_id}. HTTP status code: ${HTTP_STATUS}"
        echo "Response: $HTTP_BODY"
        exit 1
    fi

    echo "Project ${project_id} deleted successfully."
done

echo "All projects deleted. If you wish to recreate them later, run bugsnag-create-projects.sh."
