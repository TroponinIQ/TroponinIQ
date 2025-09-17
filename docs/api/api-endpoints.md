# TroponinIQ API Documentation

## Overview

TroponinIQ provides a comprehensive REST API for nutrition coaching, user management, and AI interactions. All endpoints require authentication unless specified otherwise.

## Authentication

### Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://www.troponiniq.com/api`

### Authentication Methods
1. **Session-based**: NextAuth.js session cookies (web interface)
2. **API Key**: External integrations (N8N, automation tools)
3. **Bearer Token**: Future mobile app support

## Core API Endpoints

### 🤖 Chat & AI Endpoints

#### `POST /api/chat/agent`
**Primary AI chat endpoint with streaming support**

```typescript
// Request
{
  message: string,
  userId: string,
  sessionId?: string  // Chat ID for conversation continuity
}

// Response: Streaming text/plain
// Content-Type: text/plain; charset=utf-8
// Transfer-Encoding: chunked
```

**Features**:
- Streaming AI responses for real-time chat experience
- Automatic conversation history loading (up to 30 messages)
- Context-aware nutrition coaching
- Tool integration (calculations, product catalog)
- Message persistence to Firebase

**Error Responses**:
- `400`: Missing required fields
- `401`: Unauthorized
- `500`: AI processing error

#### `GET /api/chat/agent`
**Reload conversation endpoint**

```typescript
// Query Parameters
?id=<chat-id>&userId=<user-id>

// Response
{
  messages: Message[],
  success: boolean
}
```

#### `DELETE /api/chat`
**Delete chat conversation**

```typescript
// Query Parameters
?id=<chat-id>

// Response
{
  success: boolean,
  message: string
}
```

#### `GET /api/chat/history`
**Get user's chat history**

```typescript
// Response
{
  chats: Array<{
    id: string,
    title: string,
    createdAt: string,
    updatedAt: string,
    visibility: 'public' | 'private'
  }>
}
```

#### `POST /api/external/agent`
**External API for automation tools (N8N, Zapier)**

```typescript
// Headers
Authorization: Bearer <EXTERNAL_API_KEY>
// or
X-API-Key: <EXTERNAL_API_KEY>

// Request
{
  prompt: string
}

// Response: text/plain
// Direct AI response without JSON wrapper
```

**Rate Limiting**: 1.5 second minimum interval between requests

### 👤 User Management Endpoints

#### `POST /api/auth/register`
**Create new user account**

```typescript
// Request
{
  email: string,
  password: string,
  displayName?: string
}

// Response
{
  success: boolean,
  user?: {
    id: string,
    email: string,
    displayName: string
  },
  error?: string
}
```

#### `GET /api/user/profile`
**Get user nutrition profile**

```typescript
// Response
{
  profile: {
    preferred_name?: string,
    height_feet?: number,
    height_inches?: number,
    weight_lbs?: number,
    body_fat_percentage?: number,
    age?: number,
    gender?: 'male' | 'female' | 'other',
    current_activity_level?: string,
    primary_goal?: string,
    dietary_restrictions?: string,
    // ... additional profile fields
  }
}
```

#### `POST /api/user/profile`
**Update user nutrition profile**

```typescript
// Request: Partial profile object
{
  weight_lbs?: number,
  body_fat_percentage?: number,
  primary_goal?: string,
  // ... any profile fields to update
}

// Response
{
  success: boolean,
  profile: NutritionProfile
}
```

### 💰 Subscription & Billing Endpoints

#### `POST /api/stripe/create-checkout-session`
**Create Stripe checkout for subscription**

```typescript
// Request
{
  priceId: string,
  couponCode?: string
}

// Response
{
  sessionId: string,
  url: string  // Redirect URL for Stripe Checkout
}
```

#### `GET /api/subscription/status`
**Get user's subscription status**

```typescript
// Response
{
  isActive: boolean,
  plan?: string,
  expiresAt?: string,
  features: string[]
}
```

#### `POST /api/stripe/portal`
**Create customer portal session**

```typescript
// Response
{
  url: string  // Redirect URL for Stripe portal
}
```

### 📋 System Management Endpoints

#### `GET /api/system-messages`
**Get active system messages for user**

```typescript
// Query Parameters
?history=true  // Optional: get all messages instead of just active

// Response
{
  success: boolean,
  messages: Array<{
    id: string,
    title: string,
    content: string,
    type: 'update' | 'feature' | 'maintenance' | 'error' | 'announcement',
    priority: 'low' | 'medium' | 'high' | 'critical',
    startDate?: string,
    endDate?: string,
    createdAt: string
  }>
}
```

#### `POST /api/system-messages`
**Dismiss system message**

```typescript
// Request
{
  messageId: string,
  action: 'dismiss'
}

// Response
{
  success: boolean
}
```

#### `POST /api/feedback`
**Submit user feedback**

```typescript
// Request
{
  type: 'bug' | 'feature' | 'general',
  message: string,
  email?: string,
  page?: string
}

// Response
{
  success: boolean,
  message: string
}
```

### 📁 File Upload Endpoints

#### `POST /api/chat/files/upload`
**Upload files for nutrition coaching**

```typescript
// Request: multipart/form-data
// file: File (JPEG, PNG, WebP, HEIC, PDF)

// Current Status: 501 Not Implemented
{
  error: 'File upload feature coming soon',
  supportedTypes: string[],
  maxSize: string
}
```

**Planned Features**:
- Food photo analysis
- Progress photo tracking  
- Document uploads (meal plans, lab results)
- AI-powered image analysis

### 🔧 Development & Admin Endpoints

#### `POST /api/dev/simulate-subscription`
**Development: Simulate subscription status**

```typescript
// Request
{
  userId: string,
  isActive: boolean,
  plan?: string
}
```

#### `GET /api/admin/system-messages`
**Admin: Get all system messages**

```typescript
// Response
{
  messages: SystemMessage[],
  total: number
}
```

## Error Handling

### Standard Error Response Format
```typescript
{
  error: string,           // Error message
  details?: string,        // Additional details
  code?: string,          // Error code
  timestamp: string       // ISO timestamp
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate data)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error
- `501`: Not Implemented (feature disabled)
- `503`: Service Unavailable

## Rate Limiting

### General API Limits
- **Authenticated requests**: 1000 requests/hour per user
- **External API**: 1 request per 1.5 seconds
- **File uploads**: 10 uploads/hour per user (when enabled)
- **System messages**: 100 requests/hour per user

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Webhooks

### Stripe Webhooks
**Endpoint**: `/api/stripe/webhooks`

**Events Handled**:
- `customer.subscription.created`
- `customer.subscription.updated` 
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## SDKs and Integration

### JavaScript/TypeScript
```typescript
// Example API client usage
const response = await fetch('/api/chat/agent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Help me calculate my macros',
    userId: 'user-id',
    sessionId: 'chat-id'
  })
});
```

### External Automation (N8N)
```typescript
// N8N HTTP Request Node
{
  "method": "POST",
  "url": "https://www.troponiniq.com/api/external/agent",
  "headers": {
    "X-API-Key": "{{$env.TROPONIN_API_KEY}}"
  },
  "body": {
    "prompt": "Generate a cutting diet plan"
  }
}
```

## Testing

### Development Testing
```bash
# Test local API
curl -X POST http://localhost:3000/api/external/agent \
  -H "X-API-Key: test-key" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test message"}'
```

### Production Testing
```bash
# Health check
curl https://www.troponiniq.com/api/health

# Authenticated request
curl -X GET https://www.troponiniq.com/api/user/profile \
  -H "Cookie: session-token=..."
```

## Security Considerations

### API Security
- All endpoints require authentication (except external with API key)
- Input validation and sanitization on all requests
- SQL injection prevention with parameterized queries
- XSS protection with Content Security Policy
- CSRF protection with SameSite cookies

### Data Privacy
- User data access restricted by ownership
- Sensitive data (passwords) properly hashed
- Audit logging for admin actions
- GDPR compliance for European users

---

This API powers TroponinIQ's comprehensive nutrition coaching platform, providing secure and scalable access to AI-powered fitness guidance.
