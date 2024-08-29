#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <organization_id> <api_key>"
    exit 1
fi

ORGANIZATION_ID=$1
API_KEY=$2

PROJECT_PREFIX="bugsnag-otel-demo"

PROJECT_NAMES=(
    "accountingservice"
    "adservice"
    "cartservice"
    "checkoutservice"
    "currencyservice"
    "emailservice"
    "frauddetectionservice"
    "frontend"
    "frontend-web"
    "imageprovider"
    "loadgenerator"
    "paymentservice"
    "productcatalogservice"
    "quoteservice"
    "recommendationservice"
    "shippingservice"
)

PROJECT_TYPES=(
    "aspnet"
    "java"
    "aspnet_core"
    "go_net_http"
    "other"
    "sinatra"
    "other"
    "node"
    "react"
    "other"
    "flask"
    "node"
    "go"
    "php"
    "python"
    "other"
)

for index in ${!PROJECT_NAMES[@]}; do
    echo "Creating project for service ${PROJECT_NAMES[$index]} with type ${PROJECT_TYPES[$index]}"

    RESPONSE=$(curl --silent --write-out "HTTPSTATUS:%{http_code}" --location --request POST "https://api.bugsnag.com/organizations/${ORGANIZATION_ID}/projects" \
        --header "Authorization: token ${API_KEY}" \
        --header "Content-Type: application/json" \
        --data-raw "{
            \"name\": \"${PROJECT_PREFIX}-${PROJECT_NAMES[$index]}\",
            \"type\": \"${PROJECT_TYPES[$index]}\"
        }")

    HTTP_BODY=$(echo "$RESPONSE" | sed -e 's/HTTPSTATUS\:.*//g')
    HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

    if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
        echo "OK: Successfully created project  ${PROJECT_PREFIX}-${PROJECT_NAMES[$index]}"
    else
        echo "ERROR: Failed to create project for ${PROJECT_NAMES[$index]}. HTTP Code: $HTTP_STATUS"
        echo "Response: $HTTP_BODY"
    fi

    echo "-----------------------------------"
done
