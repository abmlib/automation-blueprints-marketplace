# API Integration Examples

This directory contains practical examples for integrating with the Blueprint Marketplace API using HTTP requests.

## Files

- **`curl-examples.sh`** - Comprehensive shell script with 22+ API examples
- **`test-payloads/`** - Sample JSON payloads for testing
- **`postman/`** - Postman collection (import into Postman)

## Quick Start

### 1. Set Environment Variables

```bash
export API_BASE_URL="http://localhost:3001/api"
export AUTH_TOKEN="your_jwt_token_here"
```

### 2. Run Example Script

```bash
chmod +x curl-examples.sh
./curl-examples.sh
```

## API Endpoints Overview

### Authentication

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "name": "User Name",
    "role": "CREATOR"
  }
}
```

### Blueprint Operations

#### Validate Blueprint
```bash
POST /api/validate
Content-Type: application/json

{
  "id": "my-blueprint",
  "name": "My Blueprint",
  "version": "1.0.0",
  "trigger": { ... },
  "steps": [ ... ]
}
```

#### Publish Blueprint
```bash
POST /api/blueprints
Authorization: Bearer {token}
Content-Type: application/json

{
  "slug": "unique-blueprint-slug",
  "title": "Blueprint Title",
  "summary": "Short description",
  "descriptionMd": "# Full Description",
  "apps": ["app1", "app2"],
  "tags": ["tag1", "tag2"],
  "dsl": { ... }
}
```

#### Get Blueprints
```bash
# All blueprints
GET /api/blueprints?page=1&limit=10

# Filter by tags
GET /api/blueprints?tags=sales,automation

# Filter by apps
GET /api/blueprints?apps=slack,hubspot

# Search by keyword
GET /api/blueprints?search=invoice
```

#### Get Single Blueprint
```bash
GET /api/blueprints/{slug}
```

### Export Operations

#### Export to Platform
```bash
POST /api/blueprints/export
Authorization: Bearer {token}
Content-Type: application/json

{
  "blueprintSlug": "my-blueprint",
  "targetRuntime": "zapier"
}
```

**Supported runtimes:** `zapier`, `make`, `n8n`, `power-automate`

#### Batch Export
```bash
POST /api/blueprints/export/batch
Authorization: Bearer {token}
Content-Type: application/json

{
  "blueprintSlug": "my-blueprint",
  "targetRuntimes": ["zapier", "n8n", "make"]
}
```

### Reviews and Ratings

#### Add Review
```bash
POST /api/blueprints/{slug}/reviews
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 5,
  "text": "Great blueprint!"
}
```

#### Get Reviews
```bash
GET /api/blueprints/{slug}/reviews
```

### Favorites

#### Add to Favorites
```bash
POST /api/blueprints/{slug}/favorite
Authorization: Bearer {token}
```

#### Remove from Favorites
```bash
DELETE /api/blueprints/{slug}/favorite
Authorization: Bearer {token}
```

#### Get User Favorites
```bash
GET /api/users/me/favorites
Authorization: Bearer {token}
```

## Common Integration Patterns

### Pattern 1: Validate → Publish Workflow

```bash
# Step 1: Validate blueprint
VALIDATION_RESULT=$(curl -s -X POST "$API_BASE_URL/validate" \
  -H "Content-Type: application/json" \
  -d @my-blueprint.json)

# Step 2: Check if valid
if echo "$VALIDATION_RESULT" | jq -e '.valid' > /dev/null; then
  echo "Blueprint is valid, publishing..."
  
  # Step 3: Publish
  curl -X POST "$API_BASE_URL/blueprints" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d @my-blueprint.json
else
  echo "Validation failed:"
  echo "$VALIDATION_RESULT" | jq '.errors'
fi
```

### Pattern 2: Export to All Platforms

```bash
BLUEPRINT_SLUG="my-blueprint"
PLATFORMS=("zapier" "make" "n8n" "power-automate")

for platform in "${PLATFORMS[@]}"; do
  echo "Exporting to $platform..."
  curl -X POST "$API_BASE_URL/blueprints/export" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "{\"blueprintSlug\":\"$BLUEPRINT_SLUG\",\"targetRuntime\":\"$platform\"}" \
    > "exports/${platform}/${BLUEPRINT_SLUG}.json"
done
```

### Pattern 3: Search and Bulk Download

```bash
# Search for blueprints by tag
SEARCH_RESULTS=$(curl -s -X GET "$API_BASE_URL/blueprints?tags=sales")

# Extract blueprint slugs
SLUGS=$(echo "$SEARCH_RESULTS" | jq -r '.data[].slug')

# Download each blueprint
for slug in $SLUGS; do
  echo "Downloading $slug..."
  curl -s -X GET "$API_BASE_URL/blueprints/$slug" \
    > "downloads/${slug}.json"
done
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "dsl.trigger",
      "message": "Trigger is required"
    }
  ]
}
```

### Common Error Codes

- **400 Bad Request** - Invalid input or validation error
- **401 Unauthorized** - Missing or invalid authentication token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource already exists (e.g., duplicate slug)
- **422 Unprocessable Entity** - DSL validation failed
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server error

## Rate Limiting

API endpoints are rate-limited:
- **Anonymous:** 10 requests/minute
- **Authenticated:** 100 requests/minute
- **Premium:** 1000 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Testing with Different Tools

### Using httpie

```bash
# Install httpie
pip install httpie

# Make requests
http POST localhost:3001/api/validate < blueprint.json
http GET localhost:3001/api/blueprints Authorization:"Bearer $TOKEN"
```

### Using Postman

1. Import `postman/blueprint-marketplace.postman_collection.json`
2. Set environment variable `base_url` = `http://localhost:3001/api`
3. Set environment variable `auth_token` = your JWT token
4. Run collection

### Using JavaScript/TypeScript

```typescript
const API_BASE = 'http://localhost:3001/api';

async function validateBlueprint(dsl: any) {
  const response = await fetch(`${API_BASE}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dsl)
  });
  
  return response.json();
}

async function publishBlueprint(blueprint: any, token: string) {
  const response = await fetch(`${API_BASE}/blueprints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(blueprint)
  });
  
  return response.json();
}
```

### Using Python

```python
import requests

API_BASE = 'http://localhost:3001/api'

def validate_blueprint(dsl):
    response = requests.post(
        f'{API_BASE}/validate',
        json=dsl
    )
    return response.json()

def publish_blueprint(blueprint, token):
    response = requests.post(
        f'{API_BASE}/blueprints',
        json=blueprint,
        headers={'Authorization': f'Bearer {token}'}
    )
    return response.json()
```

## Webhooks

Subscribe to blueprint events:

```bash
POST /api/webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["blueprint.published", "blueprint.updated"],
  "secret": "webhook_secret_for_signature_verification"
}
```

**Webhook payload:**
```json
{
  "event": "blueprint.published",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "blueprintSlug": "my-blueprint",
    "version": "1.0.0",
    "author": "user@example.com"
  }
}
```

## API Versioning

Current version: **v1**

Include version in Accept header:
```
Accept: application/vnd.blueprint-marketplace.v1+json
```

## OpenAPI Specification

View full API documentation:
- Swagger UI: http://localhost:3001/api/docs
- OpenAPI JSON: http://localhost:3001/api/docs-json
- OpenAPI YAML: [../../docs/api/openapi.yaml](../../../docs/api/openapi.yaml)

## Further Reading

- [OpenAPI Specification](../../../docs/api/openapi.yaml)
- [Authentication Guide](../../../docs/authentication.md)
- [Blueprint DSL Reference](../../../packages/dsl/README.md)
- [Platform Adapters](../../../packages/adapters/README.md)
