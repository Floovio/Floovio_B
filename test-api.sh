#!/bin/bash

# Base URL
API_URL="http://localhost:4000/api"

# Token placeholder - Replace this with your actual Supabase JWT
TOKEN="<YOUR_SUPABASE_ACCESS_TOKEN>"

echo "---------------------------------------------------"
echo "1. Testing Public Endpoints"
echo "---------------------------------------------------"

echo "GET /campaigns (List all campaigns)"
curl -s "$API_URL/campaigns" | python3 -m json.tool
echo -e "\n"

# Fetch a campaign ID from the list if possible, or use a hardcoded one from seed
# Seeded campaign ID might vary if UUIDs are random, but let's try to list first
# For this script, we'll just show the command for a specific ID
echo "GET /campaigns/:id (Get specific campaign - replace ID)"
echo "curl -s \"$API_URL/campaigns/<CAMPAIGN_ID>\""
echo -e "\n"

echo "---------------------------------------------------"
echo "2. Testing Protected Endpoints (Requires TOKEN)"
echo "---------------------------------------------------"
echo "Current Token: $TOKEN"
echo ""

echo "GET /auth/me (Get Current Profile)"
curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/auth/me" | python3 -m json.tool
echo -e "\n"

echo "POST /auth/profile (Create/Update Brand Profile)"
curl -s -X POST "$API_URL/auth/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "BRAND",
    "name": "My Test Brand",
    "industry": "Software",
    "bio": "Testing via curl"
  }' | python3 -m json.tool
echo -e "\n"

echo "POST /campaigns (Create Campaign - Must be BRAND)"
curl -s -X POST "$API_URL/campaigns" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Curl Test Campaign",
    "description": "Created via curl script",
    "budget": 1500.00,
    "deadline": "2025-12-31",
    "content_type": "video",
    "num_creators": 3,
    "niche_tags": ["testing", "api"]
  }' | python3 -m json.tool
echo -e "\n"

echo "GET /submissions/presign (Get Upload URL - Must be CREATOR)"
curl -s "$API_URL/submissions/presign" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
echo -e "\n"

echo "---------------------------------------------------"
echo "Done."
