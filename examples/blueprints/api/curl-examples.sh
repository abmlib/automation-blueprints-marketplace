#!/bin/bash

# Blueprint Marketplace API Integration Examples
# Base URL for API (change if deploying to production)
API_BASE_URL="${API_BASE_URL:-http://localhost:3001/api}"

# Authentication token (obtain via login endpoint)
AUTH_TOKEN="${AUTH_TOKEN:-your_auth_token_here}"

echo "=== Blueprint Marketplace API Examples ==="
echo "Base URL: $API_BASE_URL"
echo ""

# ============================================
# 1. AUTHENTICATION
# ============================================

echo "1. User Login (obtain JWT token)"
curl -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "creator@example.com",
    "password": "Passw0rd!"
  }'
echo -e "\n---\n"

# ============================================
# 2. BLUEPRINT VALIDATION
# ============================================

echo "2. Validate Blueprint DSL"
curl -X POST "$API_BASE_URL/validate" \
  -H "Content-Type: application/json" \
  -d @../basic/hubspot-slack-simple.json
echo -e "\n---\n"

# ============================================
# 3. BLUEPRINT PUBLISHING
# ============================================

echo "3. Publish New Blueprint"
curl -X POST "$API_BASE_URL/blueprints" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "slug": "my-new-blueprint",
    "title": "My New Automation Blueprint",
    "summary": "A custom automation blueprint",
    "descriptionMd": "# My Blueprint\n\nThis automates...",
    "apps": ["hubspot", "slack"],
    "tags": ["sales", "notifications"],
    "dsl": {
      "id": "my-blueprint",
      "name": "My Blueprint",
      "version": "1.0.0",
      "apps": ["hubspot", "slack"],
      "trigger": {
        "app": "hubspot",
        "event": "contact.created"
      },
      "steps": [
        {
          "id": "notify",
          "app": "slack",
          "action": "send_message",
          "inputs": {
            "channel": "#general",
            "text": "New contact: {{trigger.contact.email}}"
          }
        }
      ]
    }
  }'
echo -e "\n---\n"

# ============================================
# 4. BLUEPRINT RETRIEVAL
# ============================================

echo "4. Get All Blueprints (with pagination)"
curl -X GET "$API_BASE_URL/blueprints?page=1&limit=10" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "5. Get Blueprint by Slug"
curl -X GET "$API_BASE_URL/blueprints/lead-to-contract-automation" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "6. Search Blueprints by Tag"
curl -X GET "$API_BASE_URL/blueprints?tags=sales,automation" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "7. Search Blueprints by App"
curl -X GET "$API_BASE_URL/blueprints?apps=slack" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

# ============================================
# 5. BLUEPRINT EXPORT
# ============================================

echo "8. Export Blueprint to Zapier Format"
curl -X POST "$API_BASE_URL/blueprints/export" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "blueprintSlug": "stripe-invoice-slack-notifications",
    "targetRuntime": "zapier"
  }' > ../exports/zapier/exported-blueprint.json
echo "Exported to exports/zapier/exported-blueprint.json"
echo -e "\n---\n"

echo "9. Export Blueprint to n8n Format"
curl -X POST "$API_BASE_URL/blueprints/export" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "blueprintSlug": "stripe-invoice-slack-notifications",
    "targetRuntime": "n8n"
  }' > ../exports/n8n/exported-workflow.json
echo "Exported to exports/n8n/exported-workflow.json"
echo -e "\n---\n"

echo "10. Export Blueprint to Make Format"
curl -X POST "$API_BASE_URL/blueprints/export" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "blueprintSlug": "stripe-invoice-slack-notifications",
    "targetRuntime": "make"
  }' > ../exports/make/exported-scenario.json
echo "Exported to exports/make/exported-scenario.json"
echo -e "\n---\n"

# ============================================
# 6. BLUEPRINT IMPORT/CLONE
# ============================================

echo "11. Import/Clone Blueprint"
curl -X POST "$API_BASE_URL/blueprints/import" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "blueprintSlug": "lead-to-contract-automation",
    "targetRuntime": "zapier"
  }'
echo -e "\n---\n"

# ============================================
# 7. REVIEWS AND RATINGS
# ============================================

echo "12. Add Blueprint Review"
curl -X POST "$API_BASE_URL/blueprints/lead-to-contract-automation/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "rating": 5,
    "text": "Excellent blueprint! Saved us hours of manual work."
  }'
echo -e "\n---\n"

echo "13. Get Blueprint Reviews"
curl -X GET "$API_BASE_URL/blueprints/lead-to-contract-automation/reviews" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

# ============================================
# 8. FAVORITES
# ============================================

echo "14. Add Blueprint to Favorites"
curl -X POST "$API_BASE_URL/blueprints/lead-to-contract-automation/favorite" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN"
echo -e "\n---\n"

echo "15. Get User's Favorite Blueprints"
curl -X GET "$API_BASE_URL/users/me/favorites" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN"
echo -e "\n---\n"

echo "16. Remove from Favorites"
curl -X DELETE "$API_BASE_URL/blueprints/lead-to-contract-automation/favorite" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN"
echo -e "\n---\n"

# ============================================
# 9. BLUEPRINT VERSIONS
# ============================================

echo "17. Get Blueprint Versions"
curl -X GET "$API_BASE_URL/blueprints/lead-to-contract-automation/versions" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "18. Get Specific Version"
curl -X GET "$API_BASE_URL/blueprints/lead-to-contract-automation/versions/1.0.0" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

# ============================================
# 10. STATISTICS
# ============================================

echo "19. Get Marketplace Statistics"
curl -X GET "$API_BASE_URL/stats" \
  -H "Content-Type: application/json"
echo -e "\n---\n"

echo "20. Get Blueprint Analytics"
curl -X GET "$API_BASE_URL/blueprints/lead-to-contract-automation/analytics" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN"
echo -e "\n---\n"

# ============================================
# 11. BATCH OPERATIONS
# ============================================

echo "21. Batch Validate Multiple Blueprints"
curl -X POST "$API_BASE_URL/validate/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "blueprints": [
      { "id": "bp1", "dsl": {} },
      { "id": "bp2", "dsl": {} }
    ]
  }'
echo -e "\n---\n"

echo "22. Batch Export to Multiple Platforms"
curl -X POST "$API_BASE_URL/blueprints/export/batch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "blueprintSlug": "lead-to-contract-automation",
    "targetRuntimes": ["zapier", "make", "n8n"]
  }'
echo -e "\n---\n"

echo "=== Examples Complete ==="
