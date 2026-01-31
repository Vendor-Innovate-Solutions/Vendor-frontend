# Backend API Documentation for Frontend Developers

## Table of Contents
- [Authentication](#authentication)
- [User APIs](#user-apis)
- [Onboarding & Role Selection](#onboarding--role-selection)
- [Post-Login Routing](#post-login-routing)
- [Authorization & Permissions](#authorization--permissions)
- [Common Response Formats](#common-response-formats)
- [Company Management APIs](#company-management-apis)
- [Accounting APIs](#accounting-apis)
- [Catalog (Products) APIs](#catalog-products-apis)
- [Inventory APIs](#inventory-apis)
- [Order APIs](#order-apis)
- [Invoice APIs](#invoice-apis)
- [Payment APIs](#payment-apis)
- [Party APIs](#party-apis)
- [Portal APIs](#portal-apis)
- [Pricing APIs](#pricing-apis)
- [Workflow APIs](#workflow-apis)
- [Reporting APIs](#reporting-apis)
- [GST Compliance APIs](#gst-compliance-apis)

---

## Authentication

**Base URL:** `/api/`

All API endpoints require JWT authentication unless marked as **[Public]**.

### Authentication Headers
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Login Endpoint
**POST** `/auth/login/`  
**[Public]**

**Request:**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "uuid",
    "username": "user@example.com",
    "email": "user@example.com",
    "role": "ADMIN"
  }
}
```

### Refresh Token
**POST** `/auth/token/refresh/`

**Request:**
```json
{
  "refresh": "refresh_token_here"
}
```

**Response:**
```json
{
  "access": "new_access_token"
}
```

---

## User APIs

**Base Path:** `/api/users/`

All user endpoints are **[Public]** unless otherwise specified.

### User Registration
**POST** `/api/users/register/`  
**[Public]**

Create a new user account with email, phone, and full name. **Important:** Phone number must be verified before registration using the Send/Verify OTP endpoints.

**Request:**
```json
{
  "email": "user@example.com",
  "phone": "+1234567890",
  "full_name": "John Doe",
  "password": "securepassword123"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "phone": "+1234567890",
    "full_name": "John Doe",
    "phone_verified": true,
    "created_at": "2026-01-27T08:50:00Z",
    "updated_at": "2026-01-27T08:50:00Z"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "message": "Registration successful. Your phone number is verified."
}
```

**Error Response (400 Bad Request - Phone Not Verified):**
```json
{
  "error": "Phone number must be verified before registration.",
  "detail": "Please verify your phone number using the OTP sent to your phone."
}
```

**Error Response (400 Bad Request - Validation):**
```json
{
  "email": ["This email is already registered."],
  "phone": ["This phone number is already registered."]
}
```

---

### Send Phone OTP
**POST** `/api/users/send-phone-otp/`  
**[Public]**

Send a one-time password (OTP) to the user's phone number via SMS using Twilio. This should be called BEFORE registration to verify the phone number.

**Request:**
```json
{
  "phone": "+1234567890"
}
```

**Response (200 OK):**
```json
{
  "message": "OTP sent successfully",
  "phone": "+1234567890",
  "expires_in_minutes": 10
}
```

**Error Response (400 Bad Request - Already Registered):**
```json
{
  "error": "This phone number is already registered. Please login instead."
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Phone number must include country code (e.g., +1)"
}
```

---

### Verify Phone OTP
**POST** `/api/users/verify-phone-otp/`  
**[Public]**

Verify the OTP sent to the user's phone number. After successful verification, the user can proceed with registration.

**Request:**
```json
{
  "phone": "+1234567890",
  "otp": "123456"
}
```

**Response (200 OK - Pre-Registration):**
```json
{
  "message": "Phone number verified successfully. You can now proceed with registration.",
  "phone_verified": true,
  "phone": "+1234567890"
}
```

**Error Responses:**

- **OTP Expired (400 Bad Request):**
```json
{
  "error": "OTP has expired. Please request a new one."
}
```

- **Invalid OTP (400 Bad Request):**
```json
{
  "error": "Invalid OTP. Please try again."
}
```

- **Max Attempts Exceeded (400 Bad Request):**
```json
{
  "error": "Maximum OTP attempts exceeded. Please request a new OTP."
}
```

- **No OTP Found (404 Not Found):**
```json
{
  "error": "No OTP found for this phone number. Please request a new one."
}
```

---

## Onboarding & Role Selection

The user onboarding flow follows these steps:
1. **Sign up** - Create user account (POST /auth/signup)
2. **Select Role** - Choose user's primary business role (POST /auth/select-role)
3. **Create Company** - (MANUFACTURER only) Create company with defaults (POST /company/onboarding/create-company/)
4. **Add Context** - Fetch user context to determine next steps (GET /users/me/context)

### Select User Role
**POST** `/api/users/select-role/`  
**[Protected]** - Requires authentication

User selects their primary business role during onboarding. This determines available features and workflows.

**Request:**
```json
{
  "role": "MANUFACTURER"
}
```

**Available Roles:**
- `MANUFACTURER` - Manufacturing business owner
- `RETAILER` - Retail business owner
- `SUPPLIER` - Supplier/vendor
- `DISTRIBUTOR` - Distributor
- `LOGISTICS` - Logistics provider
- `SERVICE_PROVIDER` - Service provider

**Response (200 OK):**
```json
{
  "message": "Role selected successfully",
  "role": "MANUFACTURER",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "phone": "+1234567890",
    "full_name": "John Doe",
    "phone_verified": true,
    "created_at": "2026-01-27T08:50:00Z",
    "updated_at": "2026-01-27T08:50:00Z"
  }
}
```

---

### Get User Context
**GET** `/api/users/me/context/`  
**[Protected]** - Requires authentication

Fetch complete user context after login. This endpoint returns role, company information, and determines post-login routing.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "user_id": "123",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "MANUFACTURER",
  "role_selected": true,
  "has_company": true,
  "companies": [
    {
      "id": "company-uuid-1",
      "name": "ABC Manufacturing",
      "code": "ABC001",
      "role": "OWNER",
      "is_default": true
    },
    {
      "id": "company-uuid-2",
      "name": "XYZ Industries",
      "code": "XYZ001",
      "role": "MANAGER",
      "is_default": false
    }
  ],
  "default_company": {
    "id": "company-uuid-1",
    "name": "ABC Manufacturing",
    "code": "ABC001",
    "role": "OWNER"
  },
  "default_company_id": "company-uuid-1",
  "is_internal_user": true,
  "is_portal_user": false
}
```

---

## Post-Login Routing

After successful login, the backend enforces server-side routing based on user state. The middleware checks user state and returns redirect information if needed.

### Routing Rules

The backend checks these conditions in order:

**Rule 1: Role Not Selected**
```
If: user.selected_role == NULL
Then: Redirect to /select-role
```

**Rule 2: Manufacturer Without Company**
```
If: user.selected_role == 'MANUFACTURER' AND user has no company
Then: Redirect to /onboarding/company
```

**Rule 3: Multiple Companies, No Active Company**
```
If: user.company_count > 1 AND user.active_company == NULL
Then: Redirect to /select-company
```

### Redirect Response Format

When the server detects a required redirect, it returns HTTP 307 with redirect information:

```json
{
  "error": "REDIRECT_REQUIRED",
  "status_code": 307,
  "code": "ROLE_NOT_SELECTED",
  "message": "Please select your role to continue",
  "redirect_to": "/select-role"
}
```

**Possible codes:**
- `ROLE_NOT_SELECTED` - User hasn't selected role yet
- `NO_COMPANY` - MANUFACTURER user has no company
- `SELECT_COMPANY` - User has multiple companies, must select one

### Frontend Implementation

1. **After Login:** Call `GET /users/me/context/` to get user context
2. **Check Context:** Inspect `role_selected` and `has_company` flags
3. **Redirect as Needed:** If redirects are indicated, navigate user to appropriate screen
4. **Exempt Endpoints:** These endpoints don't trigger redirects:
   - POST /auth/select-role/
   - GET /users/me/context/
   - POST /company/onboarding/create-company/
   - Any endpoint in /invites/ or /partner/

---

## Authorization & Permissions

### Company Access Control

Every API endpoint that operates on a company resource requires:
1. User must be authenticated
2. User must have an active `CompanyUser` record for that company
3. User's `CompanyUser.role` must have permission for the action

### Company User Roles

Internal roles (for company employees):
- `OWNER` - Full access, company management
- `ADMIN` - Administrative access, can manage users
- `MANAGER` - Management access
- `ACCOUNTANT` - Accounting operations
- `STOCK_KEEPER` - Inventory operations
- `SALES` - Sales operations
- `VIEWER` - Read-only access

External roles (for partners):
- `EXTERNAL` - Limited access as external partner

### Authorization Errors

**No Company Access (403 Forbidden):**
```json
{
  "error": "You do not have access to this company"
}
```

**Insufficient Role Permissions (403 Forbidden):**
```json
{
  "error": "You do not have permission to access this resource",
  "detail": "This action requires one of these roles: ADMIN, OWNER"
}
```

---

### Get User Details
**GET** `/api/users/me/`  
**[Protected]** - Requires authentication

Get the authenticated user's profile information.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "phone": "+1234567890",
  "full_name": "John Doe",
  "phone_verified": true,
  "created_at": "2026-01-27T08:50:00Z",
  "updated_at": "2026-01-27T08:50:00Z"
}
```

---

### User Registration Flow

**Step 1: Send OTP**
```
POST /api/users/send-phone-otp/
```
- User provides phone number
- OTP is sent via SMS
- OTP is valid for 10 minutes
- **Note:** This happens BEFORE registration

**Step 2: Verify OTP**
```
POST /api/users/verify-phone-otp/
```
- User provides the OTP received via SMS
- Maximum 3 attempts allowed per OTP
- On successful verification, phone is marked as verified
- User can now proceed to registration

**Step 3: Register User**
```
POST /api/users/register/
```
- User provides email, phone (same verified phone), password, and full name
- System checks if phone was verified in Step 2
- Returns user data and JWT tokens
- `phone_verified` is set to `true` automatically

---

### Twilio Configuration

The backend uses Twilio to send OTP via SMS. Configuration should be set via environment variables:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number
```

---

## Common Response Formats

### Success Response (Single Object)
```json
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2",
  "created_at": "2025-01-06T10:30:00Z"
}
```

### List Response
```json
[
  { "id": "uuid1", "name": "Item 1" },
  { "id": "uuid2", "name": "Item 2" }
]
```

### Error Response
```json
{
  "error": "Error message description",
  "detail": "Additional error details"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Company Management APIs

**Base Path:** `/api/company/`

### Manufacturer Company Creation (Onboarding)

#### Create Company (MANUFACTURER Only)
**POST** `/api/company/onboarding/create-company/`  
**[Protected]** - Requires authentication

**Authorization:** Only users with `selected_role == 'MANUFACTURER'` and no existing company can use this endpoint.

This endpoint creates a complete company setup atomically:
- Creates Company record
- Creates CompanyUser with OWNER role
- Creates default CompanyFeature flags
- Creates default Financial Year
- Sets user.active_company

**Request:**
```json
{
  "name": "ABC Manufacturing",
  "code": "ABC001",
  "legal_name": "ABC Manufacturing Private Limited",
  "company_type": "PRIVATE_LIMITED",
  "timezone": "Asia/Kolkata",
  "language": "en",
  "base_currency": "currency-uuid"
}
```

**Required Fields:**
- `name` - Company name
- `code` - Unique company code (business-friendly identifier)
- `legal_name` - Official legal name
- `base_currency` - Currency ID (get from /api/company/currencies/)

**Optional Fields:**
- `company_type` - Default: `PRIVATE_LIMITED`
- `timezone` - Default: `UTC`
- `language` - Default: `en`

**Response (201 Created):**
```json
{
  "message": "Company created successfully",
  "company": {
    "id": "company-uuid",
    "code": "ABC001",
    "name": "ABC Manufacturing",
    "legal_name": "ABC Manufacturing Private Limited",
    "company_type": "PRIVATE_LIMITED",
    "timezone": "Asia/Kolkata",
    "language": "en",
    "base_currency": "currency-uuid",
    "base_currency_code": "INR",
    "base_currency_name": "Indian Rupee",
    "is_active": true
  },
  "company_user": {
    "company": "company-uuid",
    "user": "user-id",
    "role": "OWNER",
    "is_default": true
  },
  "financial_year": {
    "id": "fy-uuid",
    "name": "FY 2025-2026",
    "start_date": "2025-04-01",
    "end_date": "2026-03-31",
    "is_current": true
  }
}
```

**Error Response (403 Forbidden - Not MANUFACTURER):**
```json
{
  "error": "Only MANUFACTURER users can create companies",
  "current_role": "RETAILER"
}
```

**Error Response (400 Bad Request - Already Has Company):**
```json
{
  "error": "User already has an active company. Create another company via admin."
}
```

**Error Response (400 Bad Request - Validation):**
```json
{
  "error": "Field 'base_currency' is required"
}
```

---

### Company Management

#### List Companies
**GET** `/api/company/`

**Response:**
```json
[
  {
    "id": "uuid",
    "code": "COMP001",
    "name": "My Company Pvt Ltd",
    "legal_name": "My Company Private Limited",
    "company_type": "PRIVATE_LIMITED",
    "timezone": "Asia/Kolkata",
    "language": "en",
    "base_currency": "currency-uuid",
    "base_currency_code": "INR",
    "base_currency_name": "Indian Rupee",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

#### Create Company
**POST** `/api/company/create/`

**Request:**
```json
{
  "code": "COMP001",
  "name": "My Company Pvt Ltd",
  "legal_name": "My Company Private Limited",
  "company_type": "PRIVATE_LIMITED",
  "timezone": "Asia/Kolkata",
  "language": "en",
  "base_currency_id": "currency-uuid",
  "is_active": true
}
```

**Response (201 Created):**
```json
{
  "message": "Company created successfully",
  "company": {
    "id": "uuid",
    "code": "COMP001",
    "name": "My Company Pvt Ltd",
    "legal_name": "My Company Private Limited",
    "company_type": "PRIVATE_LIMITED",
    "timezone": "Asia/Kolkata",
    "language": "en",
    "base_currency": "currency-uuid",
    "base_currency_code": "INR",
    "base_currency_name": "Indian Rupee",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

**Company Types:**
- `PRIVATE_LIMITED` - Private Limited
- `PUBLIC_LIMITED` - Public Limited
- `PARTNERSHIP` - Partnership
- `PROPRIETORSHIP` - Proprietorship
- `LLP` - Limited Liability Partnership

**Error Response (400 Bad Request):**
```json
{
  "code": ["Company with this code already exists."],
  "base_currency_id": ["Currency does not exist."]
}
```

#### Get Company Details
**GET** `/api/company/{company_id}/`

**Response:**
```json
{
  "id": "uuid",
  "code": "COMP001",
  "name": "My Company Pvt Ltd",
  "legal_name": "My Company Private Limited",
  "company_type": "PRIVATE_LIMITED",
  "timezone": "Asia/Kolkata",
  "language": "en",
  "base_currency": "currency-uuid",
  "base_currency_code": "INR",
  "base_currency_name": "Indian Rupee",
  "is_active": true,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

#### Update Company
**PUT** `/api/company/{company_id}/`  
**PATCH** `/api/company/{company_id}/` (partial update)

**Request:**
```json
{
  "name": "Updated Company Name",
  "is_active": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "code": "COMP001",
  "name": "Updated Company Name",
  "legal_name": "My Company Private Limited",
  "company_type": "PRIVATE_LIMITED",
  "timezone": "Asia/Kolkata",
  "language": "en",
  "base_currency": "currency-uuid",
  "base_currency_code": "INR",
  "base_currency_name": "Indian Rupee",
  "is_active": true,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-27T10:00:00Z"
}
```

#### Delete Company
**DELETE** `/api/company/{company_id}/`

**Response:**
```json
{
  "message": "Company deleted successfully"
}
```

---

### Company Setup - Multi-Phase Onboarding

The company setup follows a 3-phase approach:
- **PHASE 1:** Create company with basic information
- **PHASE 2:** Configure business settings and enable modules
- **PHASE 3:** Add company addresses

#### Check Setup Status
**GET** `/api/company/{company_id}/setup-status/`

**Response:**
```json
{
  "setup_percentage": 66,
  "phase_1_complete": true,
  "phase_2_complete": true,
  "phase_3_complete": false,
  "next_steps": [
    "Add company addresses in Phase 3"
  ],
  "company": {
    "id": "uuid",
    "name": "My Company",
    "code": "COMP001",
    "setup_complete": false
  }
}
```

---

### Business Settings (Phase 2)

#### Get Business Settings
**GET** `/api/company/{company_id}/business-settings/`

**Response:**
```json
{
  "id": "uuid",
  "name": "My Company",
  "code": "COMP001",
  "legal_name": "My Company Private Limited",
  "timezone": "Asia/Kolkata",
  "language": "en",
  "base_currency": "currency-uuid",
  "features": {
    "inventory_enabled": true,
    "hr_enabled": false,
    "logistics_enabled": true,
    "workflow_enabled": true,
    "portal_enabled": false,
    "pricing_enabled": true
  }
}
```

#### Update Business Settings
**PUT** `/api/company/{company_id}/business-settings/`

**Request:**
```json
{
  "timezone": "Asia/Kolkata",
  "language": "en",
  "base_currency": "currency-uuid",
  "features": {
    "inventory_enabled": true,
    "hr_enabled": true,
    "logistics_enabled": true,
    "workflow_enabled": true,
    "portal_enabled": true,
    "pricing_enabled": true
  }
}
```

**Response:** Same as GET response with updated values

---

### Feature Management

#### Get Company Features
**GET** `/api/company/{company_id}/features/`

**Response:**
```json
{
  "company": "company-uuid",
  "inventory_enabled": true,
  "hr_enabled": false,
  "logistics_enabled": true,
  "workflow_enabled": true,
  "portal_enabled": false,
  "pricing_enabled": true
}
```

#### Update Company Features
**PUT** `/api/company/{company_id}/features/`

**Request:**
```json
{
  "inventory_enabled": true,
  "hr_enabled": true,
  "logistics_enabled": false,
  "workflow_enabled": true,
  "portal_enabled": true,
  "pricing_enabled": true
}
```

**Response:** Same as GET response with updated values

---

### Address Management (Phase 3)

#### List Company Addresses
**GET** `/api/company/{company_id}/addresses/`

**Response:**
```json
[
  {
    "id": "uuid",
    "address_type": "REGISTERED",
    "address_line1": "123 Main Street",
    "address_line2": "Floor 2",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "country": "IN",
    "is_primary": true,
    "is_active": true,
    "created_at": "2025-01-27T10:00:00Z"
  }
]
```

#### Create Company Address
**POST** `/api/company/{company_id}/addresses/`

**Request:**
```json
{
  "address_type": "REGISTERED",
  "address_line1": "123 Main Street",
  "address_line2": "Floor 2",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400001",
  "country": "IN",
  "is_primary": true
}
```

**Response:** Same as list response item

**Address Types:**
- `REGISTERED` - Official registered address
- `BILLING` - Billing address
- `SHIPPING` - Shipping address
- `BRANCH` - Branch office address

#### Get Address Details
**GET** `/api/company/{company_id}/addresses/{address_id}/`

**Response:**
```json
{
  "id": "uuid",
  "address_type": "REGISTERED",
  "address_line1": "123 Main Street",
  "address_line2": "Floor 2",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400001",
  "country": "IN",
  "is_primary": true,
  "is_active": true,
  "created_at": "2025-01-27T10:00:00Z",
  "updated_at": "2025-01-27T10:00:00Z"
}
```

#### Update Address
**PUT** `/api/company/{company_id}/addresses/{address_id}/`  
**PATCH** `/api/company/{company_id}/addresses/{address_id}/` (partial update)

**Request:**
```json
{
  "address_line1": "456 New Street",
  "city": "Delhi",
  "state": "Delhi",
  "postal_code": "110001"
}
```

**Response:** Same as GET response with updated values

#### Delete Address
**DELETE** `/api/company/{company_id}/addresses/{address_id}/`

**Response:**
```json
{
  "message": "Address deleted successfully"
}
```

---

### Currency Management

#### List Currencies
**GET** `/api/company/currencies/`

**Response:**
```json
[
  {
    "id": "uuid",
    "code": "INR",
    "name": "Indian Rupee",
    "symbol": "₹",
    "decimal_places": 2
  },
  {
    "id": "uuid",
    "code": "USD",
    "name": "US Dollar",
    "symbol": "$",
    "decimal_places": 2
  }
]
```

---

### Financial Year Management

#### List Financial Years
**GET** `/api/company/financial_year/`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "FY 2025-26",
    "start_date": "2025-04-01",
    "end_date": "2026-03-31",
    "is_closed": false,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

#### Close Financial Year
**POST** `/api/company/financial_year/{fy_id}/close/`

**Request:** (Optional)
```json
{
  "close_date": "2026-03-31"
}
```

**Response:**
```json
{
  "message": "Financial year closed successfully",
  "id": "uuid",
  "is_closed": true
}
```

#### Reopen Financial Year
**POST** `/api/company/financial_year/{fy_id}/reopen/`

**Response:**
```json
{
  "message": "Financial year reopened successfully",
  "id": "uuid",
  "is_closed": false
}
```

---

## Accounting APIs

**Base Path:** `/api/accounting/`

### Ledger Management

#### List Ledgers
**GET** `/api/accounting/ledgers/`

**Query Parameters:**
- `group` - Filter by account group ID
- `is_active` - Filter by active status (true/false)
- `search` - Search by ledger name

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Cash Account",
    "group": "group-uuid",
    "group_name": "Cash-in-Hand",
    "group_nature": "ASSET",
    "opening_balance": "10000.00",
    "opening_balance_type": "DR",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

#### Create Ledger
**POST** `/api/accounting/ledgers/`

**Request:**
```json
{
  "name": "New Bank Account",
  "group": "group-uuid",
  "opening_balance": "50000.00",
  "opening_balance_type": "DR",
  "is_active": true
}
```

**Response:** Same as ledger object above

#### Get Ledger Details
**GET** `/api/accounting/ledgers/{ledger_id}/`

**Response:** Single ledger object

#### Update Ledger
**PUT** `/api/accounting/ledgers/{ledger_id}/`  
**PATCH** `/api/accounting/ledgers/{ledger_id}/` (partial update)

**Request:**
```json
{
  "name": "Updated Bank Account",
  "opening_balance": "60000.00"
}
```

#### Delete Ledger
**DELETE** `/api/accounting/ledgers/{ledger_id}/`

**Response:** `204 No Content`

---

### Account Groups

#### List Account Groups
**GET** `/api/accounting/groups/`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Current Assets",
    "code": "CA",
    "parent": null,
    "nature": "ASSET",
    "report_type": "BS",
    "path": "Current Assets",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

#### Create Account Group
**POST** `/api/accounting/groups/`

**Request:**
```json
{
  "name": "Sundry Debtors",
  "code": "SD",
  "parent": "parent-group-uuid",
  "nature": "ASSET",
  "report_type": "BS"
}
```

#### Get/Update/Delete Account Group
**GET** `/api/accounting/groups/{group_id}/`  
**PUT** `/api/accounting/groups/{group_id}/`  
**PATCH** `/api/accounting/groups/{group_id}/`  
**DELETE** `/api/accounting/groups/{group_id}/`

---

### Financial Reports

#### Trial Balance
**GET** `/api/accounting/reports/trial-balance/`

**Query Parameters:**
- `fy_id` - Financial Year ID (required)
- `as_of_date` - Date filter (YYYY-MM-DD)

**Response:**
```json
{
  "financial_year": "FY 2025-26",
  "as_of_date": "2025-12-31",
  "ledgers": [
    {
      "ledger_id": "uuid",
      "ledger_name": "Cash Account",
      "debit": "50000.00",
      "credit": "0.00"
    }
  ],
  "total_debit": "150000.00",
  "total_credit": "150000.00"
}
```

#### Profit & Loss Statement
**GET** `/api/accounting/reports/pl/`

**Query Parameters:**
- `fy_id` - Financial Year ID (required)
- `start_date` - From date (YYYY-MM-DD)
- `end_date` - To date (YYYY-MM-DD)

**Response:**
```json
{
  "period": "FY 2025-26",
  "revenue": "500000.00",
  "expenses": "300000.00",
  "net_profit": "200000.00"
}
```

#### Balance Sheet
**GET** `/api/accounting/reports/bs/`

**Query Parameters:**
- `fy_id` - Financial Year ID (required)
- `as_of_date` - Date (YYYY-MM-DD)

**Response:**
```json
{
  "as_of_date": "2025-12-31",
  "assets": {
    "current_assets": "200000.00",
    "fixed_assets": "500000.00",
    "total": "700000.00"
  },
  "liabilities": {
    "current_liabilities": "100000.00",
    "equity": "600000.00",
    "total": "700000.00"
  }
}
```

---

## Catalog (Products) APIs

**Base Path:** `/api/catalog/`

### Categories

#### List Categories
**GET** `/api/catalog/categories/`

**Response:**
```json
[
  {
    "id": "uuid",
    "company_id": "company-uuid",
    "name": "Electronics",
    "description": "Electronic items",
    "is_active": true,
    "display_order": 1,
    "product_count": 25,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

#### Create Category
**POST** `/api/catalog/categories/`

**Request:**
```json
{
  "name": "New Category",
  "description": "Category description",
  "is_active": true,
  "display_order": 10
}
```

#### Get Category Details
**GET** `/api/catalog/categories/{category_id}/`

#### Update Category
**PUT** `/api/catalog/categories/{category_id}/`  
**PATCH** `/api/catalog/categories/{category_id}/`

**Request:**
```json
{
  "name": "Updated Category Name",
  "is_active": false
}
```

#### Delete Category
**DELETE** `/api/catalog/categories/{category_id}/`

---

### Products

#### List Products
**GET** `/api/catalog/products/`

**Query Parameters:**
- `category_id` - Filter by category
- `status` - Filter by status (ACTIVE, INACTIVE)
- `is_portal_visible` - Show portal visible items (true/false)
- `search` - Search by name or SKU

**Response:**
```json
[
  {
    "id": "uuid",
    "company_id": "company-uuid",
    "name": "Product Name",
    "category_id": "category-uuid",
    "category_name": "Electronics",
    "brand": "Brand Name",
    "available_quantity": "100.000",
    "unit": "PCS",
    "price": "1500.00",
    "status": "ACTIVE",
    "is_portal_visible": true,
    "is_featured": false,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

#### Create Product
**POST** `/api/catalog/products/`

**Request:**
```json
{
  "name": "New Product",
  "category_id": "category-uuid",
  "description": "Product description",
  "brand": "Brand Name",
  "available_quantity": "50.000",
  "unit": "PCS",
  "price": "2500.00",
  "hsn_code": "8471",
  "cgst_rate": "9.00",
  "sgst_rate": "9.00",
  "igst_rate": "18.00",
  "cess_rate": "0.00",
  "is_portal_visible": true,
  "is_featured": false,
  "status": "ACTIVE"
}
```

#### Get Product Details
**GET** `/api/catalog/products/{product_id}/`

**Response:**
```json
{
  "id": "uuid",
  "company_id": "company-uuid",
  "name": "Product Name",
  "category_id": "category-uuid",
  "category_name": "Electronics",
  "description": "Detailed product description",
  "brand": "Brand Name",
  "available_quantity": "100.000",
  "unit": "PCS",
  "total_shipped": "50.000",
  "total_required_quantity": "150.000",
  "price": "1500.00",
  "hsn_code": "8471",
  "cgst_rate": "9.00",
  "sgst_rate": "9.00",
  "igst_rate": "18.00",
  "cess_rate": "0.00",
  "is_portal_visible": true,
  "is_featured": false,
  "status": "ACTIVE",
  "stock_item_count": 5,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-05T00:00:00Z"
}
```

#### Update Product
**PUT** `/api/catalog/products/{product_id}/`  
**PATCH** `/api/catalog/products/{product_id}/`

#### Delete Product
**DELETE** `/api/catalog/products/{product_id}/`

#### Sync Product Stock
**POST** `/api/catalog/products/{product_id}/sync-stock/`

**Request:** Empty body

**Response:**
```json
{
  "message": "Stock synchronized successfully",
  "product_id": "uuid",
  "available_quantity": "125.000"
}
```

---

## Inventory APIs

**Base Path:** `/api/inventory/`

### Stock Items

#### List Stock Items
**GET** `/api/inventory/items/`

**Query Parameters:**
- `godown` - Filter by godown ID
- `product` - Filter by product ID
- `status` - Filter by status

**Response:**
```json
[
  {
    "id": "uuid",
    "product_id": "product-uuid",
    "product_name": "Product Name",
    "godown_id": "godown-uuid",
    "godown_name": "Main Warehouse",
    "quantity": "100.000",
    "unit": "PCS",
    "status": "AVAILABLE",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

#### Create Stock Item
**POST** `/api/inventory/items/`

**Request:**
```json
{
  "product_id": "product-uuid",
  "godown_id": "godown-uuid",
  "quantity": "50.000",
  "unit": "PCS"
}
```

#### Get/Update/Delete Stock Item
**GET** `/api/inventory/items/{item_id}/`  
**PUT** `/api/inventory/items/{item_id}/`  
**PATCH** `/api/inventory/items/{item_id}/`  
**DELETE** `/api/inventory/items/{item_id}/`

---

### Godowns (Warehouses)

#### List Godowns
**GET** `/api/inventory/godowns/`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Main Warehouse",
    "location": "City, State",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

#### Create/Update/Delete Godown
**POST** `/api/inventory/godowns/`  
**GET** `/api/inventory/godowns/{godown_id}/`  
**PUT** `/api/inventory/godowns/{godown_id}/`  
**PATCH** `/api/inventory/godowns/{godown_id}/`  
**DELETE** `/api/inventory/godowns/{godown_id}/`

---

### Stock Balance

#### Get Stock Balance for Item
**GET** `/api/inventory/balance/`

**Query Parameters:**
- `product_id` - Product ID (required)
- `godown_id` - Godown ID (optional)

**Response:**
```json
{
  "product_id": "uuid",
  "product_name": "Product Name",
  "total_quantity": "250.000",
  "unit": "PCS",
  "by_godown": [
    {
      "godown_id": "uuid",
      "godown_name": "Main Warehouse",
      "quantity": "150.000"
    },
    {
      "godown_id": "uuid",
      "godown_name": "Branch Warehouse",
      "quantity": "100.000"
    }
  ]
}
```

#### List All Stock Balances
**GET** `/api/inventory/balances/`

**Query Parameters:**
- `godown_id` - Filter by godown
- `product_id` - Filter by product

**Response:**
```json
[
  {
    "product_id": "uuid",
    "product_name": "Product 1",
    "godown_name": "Main Warehouse",
    "quantity": "100.000",
    "unit": "PCS"
  }
]
```

---

### Stock Movements

#### List Stock Movements
**GET** `/api/inventory/movements/`

**Query Parameters:**
- `product_id` - Filter by product
- `godown_id` - Filter by godown
- `start_date` - From date (YYYY-MM-DD)
- `end_date` - To date (YYYY-MM-DD)

**Response:**
```json
[
  {
    "id": "uuid",
    "product_id": "uuid",
    "product_name": "Product Name",
    "godown_id": "uuid",
    "godown_name": "Main Warehouse",
    "movement_type": "IN",
    "quantity": "50.000",
    "reference_type": "PURCHASE_ORDER",
    "reference_id": "uuid",
    "movement_date": "2025-01-05",
    "created_at": "2025-01-05T10:30:00Z"
  }
]
```

---

### Stock Transfers

#### Create Stock Transfer
**POST** `/api/inventory/transfers/`

**Request:**
```json
{
  "product_id": "product-uuid",
  "from_godown_id": "godown1-uuid",
  "to_godown_id": "godown2-uuid",
  "quantity": "25.000",
  "transfer_date": "2025-01-06",
  "notes": "Transfer notes"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "COMPLETED",
  "message": "Stock transferred successfully"
}
```

---

### Stock Reservations

#### Create Stock Reservation
**POST** `/api/inventory/reservations/`

**Request:**
```json
{
  "product_id": "product-uuid",
  "godown_id": "godown-uuid",
  "quantity": "10.000",
  "reference_type": "SALES_ORDER",
  "reference_id": "order-uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "RESERVED",
  "reserved_until": "2025-01-10T00:00:00Z"
}
```

---

## Order APIs

**Base Path:** `/api/orders/`

### Sales Orders

#### List Sales Orders
**GET** `/api/orders/sales/`

**Query Parameters:**
- `status` - Filter by status (DRAFT, CONFIRMED, INVOICED, CANCELLED)
- `customer_id` - Filter by customer
- `order_date_from` - From date (YYYY-MM-DD)
- `order_date_to` - To date (YYYY-MM-DD)

**Response:**
```json
[
  {
    "id": "uuid",
    "order_number": "SO-2025-0001",
    "customer_name": "Customer Name",
    "currency_code": "INR",
    "status": "CONFIRMED",
    "order_date": "2025-01-05",
    "due_date": "2025-01-15",
    "item_count": 3,
    "created_at": "2025-01-05T10:00:00Z"
  }
]
```

#### Create Sales Order
**POST** `/api/orders/sales/`

**Request:**
```json
{
  "customer_id": "customer-uuid",
  "currency_id": "currency-uuid",
  "price_list_id": "pricelist-uuid",
  "order_date": "2025-01-06",
  "due_date": "2025-01-16",
  "shipping_address": "123 Main St, City",
  "billing_address": "123 Main St, City",
  "payment_terms": "Net 30",
  "notes": "Special instructions"
}
```

**Response:**
```json
{
  "id": "uuid",
  "order_number": "SO-2025-0002",
  "customer": "customer-uuid",
  "customer_name": "Customer Name",
  "currency": "currency-uuid",
  "currency_code": "INR",
  "price_list": "pricelist-uuid",
  "status": "DRAFT",
  "order_date": "2025-01-06",
  "due_date": "2025-01-16",
  "shipping_address": "123 Main St, City",
  "billing_address": "123 Main St, City",
  "payment_terms": "Net 30",
  "notes": "Special instructions",
  "total_amount": "0.00",
  "items": [],
  "created_at": "2025-01-06T12:00:00Z"
}
```

#### Get Sales Order Details
**GET** `/api/orders/sales/{order_id}/`

**Response:**
```json
{
  "id": "uuid",
  "order_number": "SO-2025-0001",
  "customer": "customer-uuid",
  "customer_name": "Customer Name",
  "currency": "currency-uuid",
  "currency_code": "INR",
  "price_list": "pricelist-uuid",
  "status": "CONFIRMED",
  "order_date": "2025-01-05",
  "due_date": "2025-01-15",
  "delivery_date": null,
  "shipping_address": "123 Main St, City",
  "billing_address": "123 Main St, City",
  "payment_terms": "Net 30",
  "notes": "Order notes",
  "total_amount": "15000.00",
  "items": [
    {
      "id": "item-uuid",
      "item": "product-uuid",
      "item_name": "Product Name",
      "item_sku": "SKU-001",
      "quantity": "10.000",
      "unit_rate": "1500.00",
      "uom": "uom-uuid",
      "uom_name": "PCS",
      "discount_percent": "5.00",
      "discount_amount": "750.00",
      "tax_rate": "18.00",
      "tax_amount": "2565.00",
      "line_total": "17315.00",
      "notes": "Item notes"
    }
  ],
  "created_at": "2025-01-05T10:00:00Z",
  "updated_at": "2025-01-05T10:30:00Z"
}
```

#### Add Item to Sales Order
**POST** `/api/orders/sales/{order_id}/add_item/`

**Request:**
```json
{
  "item_id": "product-uuid",
  "quantity": "5.000",
  "override_rate": "1200.00",
  "uom_id": "uom-uuid",
  "discount_percent": "10.00",
  "notes": "Item notes"
}
```

**Response:**
```json
{
  "id": "item-uuid",
  "item": "product-uuid",
  "item_name": "Product Name",
  "quantity": "5.000",
  "unit_rate": "1200.00",
  "line_total": "6000.00"
}
```

#### Update Sales Order Item
**PUT** `/api/orders/sales/{order_id}/items/{item_id}/`

**Request:**
```json
{
  "quantity": "7.000",
  "unit_rate": "1300.00",
  "discount_percent": "5.00"
}
```

#### Remove Sales Order Item
**DELETE** `/api/orders/sales/{order_id}/items/{item_id}/remove/`

**Response:** `204 No Content`

#### Confirm Sales Order
**POST** `/api/orders/sales/{order_id}/confirm/`

**Request:** Empty body

**Response:**
```json
{
  "id": "uuid",
  "order_number": "SO-2025-0001",
  "status": "CONFIRMED",
  "message": "Sales order confirmed successfully"
}
```

#### Cancel Sales Order
**POST** `/api/orders/sales/{order_id}/cancel/`

**Request:** (Optional)
```json
{
  "reason": "Customer requested cancellation"
}
```

**Response:**
```json
{
  "id": "uuid",
  "order_number": "SO-2025-0001",
  "status": "CANCELLED",
  "message": "Sales order cancelled successfully"
}
```

---

### Purchase Orders

#### List Purchase Orders
**GET** `/api/orders/purchase/`

**Query Parameters:**
- `status` - Filter by status
- `supplier_id` - Filter by supplier

**Response:** Similar to sales orders list

#### Create Purchase Order
**POST** `/api/orders/purchase/`

**Request:**
```json
{
  "supplier_id": "supplier-uuid",
  "currency_id": "currency-uuid",
  "order_date": "2025-01-06",
  "due_date": "2025-01-20",
  "shipping_address": "Warehouse address",
  "payment_terms": "Net 60",
  "notes": "Purchase notes"
}
```

#### Get Purchase Order Details
**GET** `/api/orders/purchase/{order_id}/`

#### Add Item to Purchase Order
**POST** `/api/orders/purchase/{order_id}/add_item/`

**Request:**
```json
{
  "item_id": "product-uuid",
  "quantity": "100.000",
  "override_rate": "800.00"
}
```

#### Update/Remove Purchase Order Items
**PUT** `/api/orders/purchase/{order_id}/items/{item_id}/`  
**DELETE** `/api/orders/purchase/{order_id}/items/{item_id}/remove/`

#### Confirm/Cancel Purchase Order
**POST** `/api/orders/purchase/{order_id}/confirm/`  
**POST** `/api/orders/purchase/{order_id}/cancel/`

---

## Invoice APIs

**Base Path:** `/api/invoices/`

### Invoice Management

#### List Invoices
**GET** `/api/invoices/`

**Query Parameters:**
- `status` - Filter by status (DRAFT, POSTED, PAID, CANCELLED)
- `invoice_type` - Filter by type (SALES, PURCHASE)
- `party_id` - Filter by party
- `start_date` - From date (YYYY-MM-DD)
- `end_date` - To date (YYYY-MM-DD)

**Response:**
```json
[
  {
    "id": "uuid",
    "invoice_number": "INV-2025-0001",
    "invoice_date": "2025-01-05",
    "due_date": "2025-01-15",
    "party_name": "Customer Name",
    "invoice_type": "SALES",
    "status": "POSTED",
    "currency_code": "INR",
    "total_value": "15000.00",
    "amount_received": "5000.00",
    "outstanding_amount": "10000.00",
    "created_at": "2025-01-05T10:00:00Z"
  }
]
```

#### Get Invoice Details
**GET** `/api/invoices/{invoice_id}/`

**Response:**
```json
{
  "id": "uuid",
  "invoice_number": "INV-2025-0001",
  "invoice_date": "2025-01-05",
  "due_date": "2025-01-15",
  "party": "party-uuid",
  "party_name": "Customer Name",
  "invoice_type": "SALES",
  "status": "POSTED",
  "currency": "currency-uuid",
  "currency_code": "INR",
  "sales_order": "order-uuid",
  "sales_order_number": "SO-2025-0001",
  "purchase_order": null,
  "purchase_order_number": null,
  "voucher": "voucher-uuid",
  "voucher_number": "V-2025-0001",
  "total_value": "15000.00",
  "amount_received": "5000.00",
  "outstanding_amount": "10000.00",
  "shipping_address": "123 Main St, City",
  "billing_address": "123 Main St, City",
  "notes": "Invoice notes",
  "lines": [
    {
      "id": "line-uuid",
      "line_no": 1,
      "item": "product-uuid",
      "item_name": "Product Name",
      "item_sku": "SKU-001",
      "description": "Product description",
      "quantity": "10.000",
      "unit_rate": "1500.00",
      "uom": "uom-uuid",
      "uom_name": "PCS",
      "discount_pct": "5.00",
      "line_total": "14250.00",
      "tax_amount": "2565.00"
    }
  ],
  "created_at": "2025-01-05T10:00:00Z",
  "updated_at": "2025-01-05T11:00:00Z"
}
```

#### Create Invoice from Sales Order
**POST** `/api/invoices/from_sales_order/{so_id}/`

**Request:**
```json
{
  "partial_allowed": false,
  "apply_gst": true,
  "company_state_code": "27"
}
```

**Response:**
```json
{
  "id": "uuid",
  "invoice_number": "INV-2025-0002",
  "status": "DRAFT",
  "total_value": "15000.00"
}
```

#### Post Invoice (Create Voucher)
**POST** `/api/invoices/{invoice_id}/post_voucher/`

**Request:** Empty body

**Response:**
```json
{
  "invoice_id": "uuid",
  "voucher_id": "uuid",
  "voucher_number": "V-2025-0002",
  "status": "POSTED",
  "message": "Invoice posted successfully"
}
```

#### Get Outstanding Invoices
**GET** `/api/invoices/outstanding/`

**Query Parameters:**
- `party_id` - Filter by party (optional)
- `invoice_type` - SALES or PURCHASE

**Response:**
```json
[
  {
    "id": "uuid",
    "invoice_number": "INV-2025-0001",
    "party_name": "Customer Name",
    "invoice_date": "2025-01-05",
    "due_date": "2025-01-15",
    "total_value": "15000.00",
    "amount_received": "5000.00",
    "outstanding_amount": "10000.00",
    "days_overdue": 0
  }
]
```

---

## Payment APIs

**Base Path:** `/api/payments/`

### Payment Management

#### List Payments
**GET** `/api/payments/`

**Query Parameters:**
- `status` - Filter by status (DRAFT, POSTED)
- `party_id` - Filter by party
- `payment_type` - PAYMENT or RECEIPT
- `start_date` - From date (YYYY-MM-DD)
- `end_date` - To date (YYYY-MM-DD)

**Response:**
```json
[
  {
    "id": "uuid",
    "voucher_number": "V-2025-0001",
    "payment_type": "RECEIPT",
    "party_name": "Customer Name",
    "payment_date": "2025-01-06",
    "payment_mode": "BANK_TRANSFER",
    "status": "POSTED",
    "total_allocated": "5000.00",
    "created_at": "2025-01-06T10:00:00Z"
  }
]
```

#### Create Payment
**POST** `/api/payments/create/`

**Request:**
```json
{
  "party_id": "party-uuid",
  "bank_account_id": "bank-account-uuid",
  "payment_type": "RECEIPT",
  "payment_date": "2025-01-06",
  "payment_mode": "BANK_TRANSFER",
  "reference_number": "TXN-12345",
  "notes": "Payment notes"
}
```

**Response:**
```json
{
  "id": "uuid",
  "voucher": null,
  "voucher_number": null,
  "payment_type": "RECEIPT",
  "party": "party-uuid",
  "party_name": "Customer Name",
  "bank_account": "bank-account-uuid",
  "bank_account_name": "HDFC Bank",
  "payment_date": "2025-01-06",
  "payment_mode": "BANK_TRANSFER",
  "reference_number": "TXN-12345",
  "status": "DRAFT",
  "notes": "Payment notes",
  "total_allocated": "0.00",
  "lines": [],
  "created_at": "2025-01-06T10:00:00Z"
}
```

#### Get Payment Details
**GET** `/api/payments/{payment_id}/`

**Response:**
```json
{
  "id": "uuid",
  "voucher": "voucher-uuid",
  "voucher_number": "V-2025-0005",
  "payment_type": "RECEIPT",
  "party": "party-uuid",
  "party_name": "Customer Name",
  "bank_account": "bank-account-uuid",
  "bank_account_name": "HDFC Bank",
  "payment_date": "2025-01-06",
  "payment_mode": "BANK_TRANSFER",
  "reference_number": "TXN-12345",
  "status": "POSTED",
  "notes": "Payment notes",
  "total_allocated": "5000.00",
  "lines": [
    {
      "id": "line-uuid",
      "invoice": "invoice-uuid",
      "invoice_number": "INV-2025-0001",
      "invoice_party": "Customer Name",
      "invoice_total": "15000.00",
      "amount_applied": "5000.00",
      "created_at": "2025-01-06T10:15:00Z"
    }
  ],
  "created_at": "2025-01-06T10:00:00Z",
  "updated_at": "2025-01-06T10:30:00Z"
}
```

#### Allocate Payment to Invoice
**POST** `/api/payments/{payment_id}/allocate/`

**Request:**
```json
{
  "invoice_id": "invoice-uuid",
  "amount_applied": "5000.00"
}
```

**Response:**
```json
{
  "id": "line-uuid",
  "invoice": "invoice-uuid",
  "invoice_number": "INV-2025-0001",
  "amount_applied": "5000.00",
  "message": "Payment allocated successfully"
}
```

#### Remove Payment Allocation
**DELETE** `/api/payments/{payment_id}/lines/{line_id}/`

**Response:** `204 No Content`

#### Post Payment (Create Voucher)
**POST** `/api/payments/{payment_id}/post_voucher/`

**Request:** Empty body

**Response:**
```json
{
  "payment_id": "uuid",
  "voucher_id": "uuid",
  "voucher_number": "V-2025-0005",
  "status": "POSTED",
  "message": "Payment posted successfully"
}
```

---

### Voucher Reversal

#### Reverse Voucher
**POST** `/api/payments/vouchers/{voucher_id}/reverse/`

**Request:**
```json
{
  "reversal_date": "2025-01-07",
  "reason": "Payment cancelled by customer"
}
```

**Response:**
```json
{
  "original_voucher_id": "uuid",
  "reversal_voucher_id": "uuid",
  "reversal_voucher_number": "V-2025-0006",
  "message": "Voucher reversed successfully"
}
```

---

## Party APIs

**Base Path:** `/api/party/`

### Party Management

#### List Parties
**GET** `/api/party/`

**Query Parameters:**
- `party_type` - Filter by type (CUSTOMER, SUPPLIER, BOTH)
- `is_active` - Filter by active status (true/false)
- `search` - Search by name

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Customer Name",
    "party_type": "CUSTOMER",
    "gstin": "27XXXXX1234X1Z5",
    "contact_person": "John Doe",
    "email": "customer@example.com",
    "phone": "+91-9876543210",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

#### Get Party Credit Status
**GET** `/api/party/{party_id}/credit_status/`

**Response:**
```json
{
  "party_id": "uuid",
  "party_name": "Customer Name",
  "credit_limit": "100000.00",
  "credit_used": "45000.00",
  "credit_available": "55000.00",
  "overdue_amount": "5000.00",
  "credit_days": 30,
  "status": "GOOD"
}
```

#### Check if Party Can Order
**GET** `/api/party/{party_id}/can_order/`

**Query Parameters:**
- `order_amount` - Proposed order amount

**Response:**
```json
{
  "can_order": true,
  "reason": null,
  "credit_available": "55000.00",
  "proposed_amount": "10000.00"
}
```

OR

```json
{
  "can_order": false,
  "reason": "Credit limit exceeded",
  "credit_available": "5000.00",
  "proposed_amount": "10000.00"
}
```

---

## Portal APIs

**Base Path:** `/api/portal/`

These APIs are designed for B2B retailer portal access.

### Retailer Registration Flow

The retailer registration flow is integrated with the main user registration:

1. **Register User Account** - `POST /api/users/register/` (with email, phone, password)
2. **Login** - `POST /auth/login/` (get JWT tokens)
3. **Select Role** - `POST /api/users/select-role/` with `{"role": "RETAILER"}`
4. **Complete Retailer Profile** - `POST /api/portal/register/` (optional company_id)
5. **Discover Companies** - `GET /api/portal/companies/discover/` (find companies to request access)

### Register/Complete Retailer Profile
**POST** `/api/portal/register/`  
**[Protected]** - Requires authentication

Complete retailer profile for an already registered user. The user's email and phone are already in the system from user registration.

**Request:**
```json
{
  "company_id": "uuid-of-company"
}
```

**Note:** `company_id` is **optional**. If not provided, the user can discover companies later and request access.

**Response (with company_id):**
```json
{
  "detail": "Retailer profile updated",
  "user_id": "2",
  "email": "retailer@example.com",
  "phone": "+919876543210",
  "retailer_user_id": "uuid",
  "company_name": "Vendor Company",
  "company_id": "uuid",
  "status": "PENDING",
  "message": "Your request to access Vendor Company has been submitted. An administrator will review your request."
}
```

**Response (without company_id):**
```json
{
  "detail": "Retailer profile updated",
  "user_id": "2",
  "email": "retailer@example.com",
  "phone": "+919876543210",
  "message": "Profile updated. You can discover and request access to companies later."
}
```

---

### Complete Profile with Address
**POST** `/api/portal/complete-profile/`  
**[Protected]** - Requires authentication

Alternative endpoint to complete retailer profile with business address details.

**Request:**
```json
{
  "company_id": "uuid-of-company",
  "business_name": "My Retail Shop",
  "address": {
    "address_line1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "country": "IN"
  }
}
```

**Response:**
```json
{
  "detail": "Retailer profile completed",
  "user_id": "2",
  "email": "retailer@example.com",
  "phone": "+919876543210",
  "retailer_user_id": "uuid",
  "company_name": "Vendor Company",
  "company_id": "uuid",
  "status": "PENDING",
  "message": "Profile completed. Your request to access Vendor Company is pending approval."
}
```

---

#### Discover Companies
**GET** `/api/portal/companies/discover/`  
**[Public]**

**Query Parameters:**
- `search` - Search by company name or code

**Response:**
```json
[
  {
    "company_code": "VENDOR001",
    "company_name": "Vendor Company Pvt Ltd",
    "description": "Leading B2B supplier",
    "contact_email": "sales@vendor.com"
  }
]
```

---

### Retailer Management (Admin)

#### List Retailers
**GET** `/api/portal/retailers/`

**Query Parameters:**
- `status` - Filter by status (PENDING, APPROVED, REJECTED)

**Response:**
```json
[
  {
    "id": "uuid",
    "business_name": "Retailer Business Name",
    "contact_person": "John Doe",
    "email": "retailer@example.com",
    "phone": "+91-9876543210",
    "status": "PENDING",
    "registered_at": "2025-01-05T10:00:00Z"
  }
]
```

#### Approve Retailer
**POST** `/api/portal/retailers/{retailer_id}/approve/`

**Response:**
```json
{
  "id": "uuid",
  "status": "APPROVED",
  "message": "Retailer approved successfully"
}
```

#### Reject Retailer
**POST** `/api/portal/retailers/{retailer_id}/reject/`

**Request:**
```json
{
  "reason": "Incomplete documentation"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "REJECTED",
  "message": "Retailer rejected"
}
```

---

### Portal Catalog (Retailer Access)

#### List Portal Items
**GET** `/api/portal/items/`

**Query Parameters:**
- `category_id` - Filter by category
- `is_featured` - Show featured items (true/false)
- `search` - Search by name

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Product Name",
    "category_name": "Electronics",
    "brand": "Brand Name",
    "price": "1500.00",
    "available_quantity": "100.000",
    "unit": "PCS",
    "is_featured": true,
    "image_url": "/media/products/product1.jpg"
  }
]
```

#### Get Portal Item Details
**GET** `/api/portal/items/{item_id}/`

**Response:**
```json
{
  "id": "uuid",
  "name": "Product Name",
  "description": "Detailed product description",
  "category_name": "Electronics",
  "brand": "Brand Name",
  "price": "1500.00",
  "available_quantity": "100.000",
  "unit": "PCS",
  "hsn_code": "8471",
  "is_featured": true,
  "specifications": {
    "color": "Black",
    "warranty": "1 Year"
  },
  "images": [
    "/media/products/product1.jpg",
    "/media/products/product1_alt.jpg"
  ]
}
```

---

### Portal Orders (Retailer Access)

#### List Retailer Orders
**GET** `/api/portal/orders/`

**Query Parameters:**
- `status` - Filter by status

**Response:**
```json
[
  {
    "id": "uuid",
    "order_number": "PO-2025-0001",
    "order_date": "2025-01-05",
    "status": "CONFIRMED",
    "total_amount": "25000.00",
    "item_count": 5
  }
]
```

#### Create Portal Order
**POST** `/api/portal/orders/create/`

**Request:**
```json
{
  "items": [
    {
      "item_id": "product-uuid",
      "quantity": "10.000"
    },
    {
      "item_id": "product-uuid-2",
      "quantity": "5.000"
    }
  ],
  "shipping_address": "Retailer address",
  "notes": "Urgent delivery required"
}
```

**Response:**
```json
{
  "id": "uuid",
  "order_number": "PO-2025-0002",
  "status": "DRAFT",
  "total_amount": "15000.00",
  "message": "Order created successfully"
}
```

#### Get Portal Order Status
**GET** `/api/portal/orders/{order_id}/`

**Response:**
```json
{
  "id": "uuid",
  "order_number": "PO-2025-0001",
  "order_date": "2025-01-05",
  "status": "CONFIRMED",
  "delivery_date": "2025-01-10",
  "total_amount": "25000.00",
  "items": [
    {
      "item_name": "Product 1",
      "quantity": "10.000",
      "unit_rate": "1500.00",
      "line_total": "15000.00"
    }
  ],
  "tracking_info": {
    "status": "In Transit",
    "last_updated": "2025-01-06T15:00:00Z"
  }
}
```

#### Reorder Previous Order
**POST** `/api/portal/orders/{order_id}/reorder/`

**Request:** Empty body

**Response:**
```json
{
  "new_order_id": "uuid",
  "order_number": "PO-2025-0003",
  "message": "Order recreated successfully"
}
```

---

## Pricing APIs

**Base Path:** `/api/pricing/`

### Item Pricing

#### Get Item Pricing
**GET** `/api/pricing/items/{item_id}/`

**Query Parameters:**
- `party_id` - Party ID (optional)
- `quantity` - Quantity for volume pricing (optional)
- `price_list_id` - Price list ID (optional)

**Response:**
```json
{
  "item_id": "uuid",
  "item_name": "Product Name",
  "base_price": "1500.00",
  "applicable_price": "1350.00",
  "discount_percent": "10.00",
  "price_list": "Special Customer Pricing",
  "quantity_breaks": [
    {
      "min_quantity": "50.000",
      "price": "1400.00"
    },
    {
      "min_quantity": "100.000",
      "price": "1300.00"
    }
  ],
  "tax_info": {
    "hsn_code": "8471",
    "cgst_rate": "9.00",
    "sgst_rate": "9.00",
    "igst_rate": "18.00"
  }
}
```

#### Get Bulk Item Pricing
**POST** `/api/pricing/items/bulk/`

**Request:**
```json
{
  "items": [
    {
      "item_id": "uuid-1",
      "quantity": "10.000"
    },
    {
      "item_id": "uuid-2",
      "quantity": "25.000"
    }
  ],
  "party_id": "party-uuid",
  "price_list_id": "pricelist-uuid"
}
```

**Response:**
```json
{
  "pricing": [
    {
      "item_id": "uuid-1",
      "item_name": "Product 1",
      "quantity": "10.000",
      "unit_price": "1500.00",
      "line_total": "15000.00"
    },
    {
      "item_id": "uuid-2",
      "item_name": "Product 2",
      "quantity": "25.000",
      "unit_price": "800.00",
      "line_total": "20000.00"
    }
  ],
  "total": "35000.00"
}
```

---

## Workflow APIs

**Base Path:** `/api/workflow/`

### Approval Management

#### Submit Approval Request
**POST** `/api/workflow/request/`

**Request:**
```json
{
  "target_type": "SALES_ORDER",
  "target_id": "order-uuid",
  "notes": "Please approve this large order"
}
```

**Response:**
```json
{
  "id": "uuid",
  "target_type": "SALES_ORDER",
  "target_id": "order-uuid",
  "status": "PENDING",
  "submitted_by": "user-uuid",
  "created_at": "2025-01-06T10:00:00Z"
}
```

#### List Approval Requests
**GET** `/api/workflow/approvals/`

**Query Parameters:**
- `status` - Filter by status (PENDING, APPROVED, REJECTED)
- `target_type` - Filter by type

**Response:**
```json
[
  {
    "id": "uuid",
    "target_type": "SALES_ORDER",
    "target_id": "order-uuid",
    "target_reference": "SO-2025-0001",
    "status": "PENDING",
    "submitted_by": "John Doe",
    "submitted_at": "2025-01-06T10:00:00Z",
    "notes": "Please approve this large order"
  }
]
```

#### Approve Request
**POST** `/api/workflow/approve/{target_type}/{target_id}/`

**Request:**
```json
{
  "notes": "Approved. Good customer."
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "APPROVED",
  "approved_by": "user-uuid",
  "approved_at": "2025-01-06T11:00:00Z",
  "message": "Request approved successfully"
}
```

#### Reject Request
**POST** `/api/workflow/reject/{target_type}/{target_id}/`

**Request:**
```json
{
  "reason": "Order value exceeds customer credit limit"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "REJECTED",
  "rejected_by": "user-uuid",
  "rejected_at": "2025-01-06T11:00:00Z",
  "message": "Request rejected"
}
```

#### Get Approval Status
**GET** `/api/workflow/status/{target_type}/{target_id}/`

**Response:**
```json
{
  "target_type": "SALES_ORDER",
  "target_id": "order-uuid",
  "status": "APPROVED",
  "submitted_by": "John Doe",
  "submitted_at": "2025-01-06T10:00:00Z",
  "approved_by": "Jane Manager",
  "approved_at": "2025-01-06T11:00:00Z",
  "notes": "Approved. Good customer."
}
```

---

## Reporting APIs

**Base Path:** `/api/reports/`

### Aging Reports

#### Get Aging Report
**GET** `/api/reports/aging/`

**Query Parameters:**
- `party_id` - Filter by party (optional)
- `as_of_date` - Date for aging calculation (YYYY-MM-DD, default: today)
- `report_type` - RECEIVABLE or PAYABLE

**Response:**
```json
{
  "report_type": "RECEIVABLE",
  "as_of_date": "2025-01-06",
  "aging_buckets": [
    {
      "party_id": "uuid",
      "party_name": "Customer Name",
      "current": "10000.00",
      "1_30_days": "5000.00",
      "31_60_days": "3000.00",
      "61_90_days": "2000.00",
      "over_90_days": "1000.00",
      "total_outstanding": "21000.00"
    }
  ],
  "summary": {
    "current": "50000.00",
    "1_30_days": "25000.00",
    "31_60_days": "15000.00",
    "61_90_days": "10000.00",
    "over_90_days": "5000.00",
    "total": "105000.00"
  }
}
```

#### Get Aging Summary
**GET** `/api/reports/aging/summary/`

**Query Parameters:**
- `as_of_date` - Date (YYYY-MM-DD)

**Response:**
```json
{
  "receivables": {
    "current": "50000.00",
    "overdue": "55000.00",
    "total": "105000.00",
    "party_count": 15
  },
  "payables": {
    "current": "30000.00",
    "overdue": "20000.00",
    "total": "50000.00",
    "party_count": 8
  }
}
```

#### Get Overdue Parties
**GET** `/api/reports/overdue/`

**Query Parameters:**
- `report_type` - RECEIVABLE or PAYABLE
- `min_days_overdue` - Minimum days overdue (default: 1)

**Response:**
```json
[
  {
    "party_id": "uuid",
    "party_name": "Customer Name",
    "total_overdue": "8000.00",
    "oldest_invoice_date": "2024-11-15",
    "days_overdue": 52,
    "invoice_count": 3,
    "contact_info": {
      "email": "customer@example.com",
      "phone": "+91-9876543210"
    }
  }
]
```

---

## GST Compliance APIs

**Base Path:** `/api/gst/`

### GST Returns

#### Generate GSTR-1
**POST** `/api/gst/gstr1/generate/`

**Request:**
```json
{
  "period": "01-2025",
  "gstin": "27XXXXX1234X1Z5"
}
```

**Response:**
```json
{
  "id": "uuid",
  "return_type": "GSTR1",
  "period": "01-2025",
  "gstin": "27XXXXX1234X1Z5",
  "status": "GENERATED",
  "total_taxable_value": "500000.00",
  "total_tax": "90000.00",
  "file_path": "/media/gst/gstr1_01_2025.json",
  "generated_at": "2025-01-06T10:00:00Z"
}
```

#### Generate GSTR-3B
**POST** `/api/gst/gstr3b/generate/`

**Request:**
```json
{
  "period": "01-2025",
  "gstin": "27XXXXX1234X1Z5"
}
```

**Response:**
```json
{
  "id": "uuid",
  "return_type": "GSTR3B",
  "period": "01-2025",
  "gstin": "27XXXXX1234X1Z5",
  "status": "GENERATED",
  "outward_supplies": "500000.00",
  "inward_supplies": "300000.00",
  "tax_payable": "36000.00",
  "file_path": "/media/gst/gstr3b_01_2025.json",
  "generated_at": "2025-01-06T10:00:00Z"
}
```

#### List GST Returns
**GET** `/api/gst/returns/`

**Query Parameters:**
- `return_type` - Filter by type (GSTR1, GSTR3B)
- `period` - Filter by period (MM-YYYY)

**Response:**
```json
[
  {
    "id": "uuid",
    "return_type": "GSTR1",
    "period": "01-2025",
    "gstin": "27XXXXX1234X1Z5",
    "status": "GENERATED",
    "generated_at": "2025-01-06T10:00:00Z"
  }
]
```

#### Get GST Return by Period
**GET** `/api/gst/returns/{period}/`

**Path Parameters:**
- `period` - Period in format MM-YYYY (e.g., "01-2025")

**Response:**
```json
{
  "period": "01-2025",
  "returns": [
    {
      "id": "uuid",
      "return_type": "GSTR1",
      "status": "GENERATED",
      "file_path": "/media/gst/gstr1_01_2025.json"
    },
    {
      "id": "uuid",
      "return_type": "GSTR3B",
      "status": "GENERATED",
      "file_path": "/media/gst/gstr3b_01_2025.json"
    }
  ]
}
```

---

## Notes for Frontend Developers

### Date Formats
- All dates are in ISO 8601 format: `YYYY-MM-DD`
- All timestamps are in ISO 8601 format with timezone: `YYYY-MM-DDTHH:MM:SSZ`

### UUID Format
- All IDs are UUIDs (128-bit): `"550e8400-e29b-41d4-a716-446655440000"`
- Use UUID format for all ID parameters

### Decimal Fields
- All monetary values are strings with 2 decimal places: `"1500.00"`
- All quantity values are strings with 3 decimal places: `"10.000"`

### Pagination
For endpoints that return large datasets, pagination may be implemented:
```json
{
  "count": 100,
  "next": "/api/endpoint/?page=2",
  "previous": null,
  "results": [...]
}
```

### Error Handling
Always check HTTP status codes and handle errors appropriately:
```javascript
if (response.status === 400) {
  // Validation error
  console.error(response.data.error);
} else if (response.status === 401) {
  // Unauthorized - redirect to login
  window.location.href = '/login';
} else if (response.status === 403) {
  // Forbidden - insufficient permissions
  alert('You do not have permission to perform this action');
}
```

### Request Headers
Always include these headers in API requests:
```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

### File Uploads
For endpoints that accept file uploads (e.g., product images), use `multipart/form-data`:
```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'multipart/form-data'
}
```

---

## API Testing with cURL Examples

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "user@example.com", "password": "password123"}'
```

### Create Sales Order
```bash
curl -X POST http://localhost:8000/api/orders/sales/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "customer-uuid",
    "currency_id": "currency-uuid",
    "order_date": "2025-01-06",
    "notes": "New order"
  }'
```

### Get Invoice Details
```bash
curl -X GET http://localhost:8000/api/invoices/invoice-uuid/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

**Document Version:** 1.0  
**Last Updated:** January 6, 2026  
**Backend Framework:** Django REST Framework  
**Authentication:** JWT (JSON Web Tokens)
