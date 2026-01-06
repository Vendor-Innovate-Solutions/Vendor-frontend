# Authentication Implementation Guide

## Overview
This document provides implementation details for the updated login and signup system supporting both RETAILER and COMPANY_USER (internal) users.

## Tech Stack
- **Form Management**: React Hook Form
- **Validation**: Zod
- **UI Components**: Shadcn/ui with Tailwind CSS
- **API**: REST endpoints for authentication

## User Types

### RETAILER
- External users (customers)
- Registration requires approval (status = PENDING)
- Can select supplier company during signup
- Fields: full_name, email, password, phone, business_name, gstin, company_id

### COMPANY_USER
- Internal users (employees, admins, accountants)
- Immediate account creation after signup
- Must select active company during login
- Fields: full_name, email, password, phone, company_id

## File Structure

```
lib/
  schemas/
    auth.ts                    # Zod validation schemas
components/
  login_form.tsx              # Updated login form
app/
  authentication/
    signup/
      page.tsx                # Updated signup page with tabs
utils/
  auth_service.ts            # API service functions
```

## Login Flow

### Required Fields
1. **email** - User's email address
2. **password** - Minimum 8 characters
3. **company_id** - UUID of selected company (mandatory)

### Process
1. User enters credentials
2. Form validates with Zod schema
3. POST to `/auth/login/`
4. Store access + refresh tokens + company_id
5. Redirect based on user_type and role:
   - RETAILER → `/retailer`
   - ADMIN/ACCOUNTANT → `/manufacturer`
   - EMPLOYEE → `/employee`

### Code Example
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/schemas/auth";

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(loginSchema),
});
```

## Signup Flow

### Tab-Based Interface
- **Retailer Tab**: For external users/customers
- **Company User Tab**: For internal employees

### RETAILER Signup
**Required Fields:**
- full_name
- email
- password
- user_type: "RETAILER"

**Optional Fields:**
- company_id (supplier selection)
- phone
- business_name
- gstin

**Process:**
1. User fills retailer form
2. Validation with Zod
3. POST to `/auth/register/`
4. Backend sets status = PENDING
5. Show message: "Registration submitted. You'll be notified after approval."
6. Redirect to login page

### COMPANY_USER Signup
**Required Fields:**
- full_name
- email
- password
- user_type: "COMPANY_USER"

**Optional Fields:**
- company_id
- phone

**Process:**
1. User fills company user form
2. Validation with Zod
3. POST to `/auth/register/`
4. Immediate account creation
5. Store tokens
6. Redirect based on role

## API Endpoints

### Login
```
POST /auth/login/

Request:
{
  "email": "user@example.com",
  "password": "password123",
  "company_id": "uuid-here"
}

Response:
{
  "access": "jwt-token",
  "refresh": "refresh-token",
  "user_type": "RETAILER" | "COMPANY_USER",
  "role": "ADMIN" | "EMPLOYEE" | "ACCOUNTANT" (for COMPANY_USER)
}
```

### Signup
```
POST /auth/register/

Request (Retailer):
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "user_type": "RETAILER",
  "company_id": "uuid-here",
  "phone": "1234567890",
  "business_name": "John's Store",
  "gstin": "GST12345"
}

Request (Company User):
{
  "full_name": "Jane Smith",
  "email": "jane@company.com",
  "password": "password123",
  "user_type": "COMPANY_USER",
  "company_id": "uuid-here"
}

Response (Approved):
{
  "access": "jwt-token",
  "refresh": "refresh-token",
  "role": "ADMIN"
}

Response (Pending):
{
  "status": "PENDING",
  "detail": "Registration submitted"
}
```

### Get Companies
```
GET /api/company/discover/

Response:
[
  {
    "id": "uuid-1",
    "name": "Company Name"
  }
]
```

### Refresh Token
```
POST /auth/refresh/

Request:
{
  "refresh": "refresh-token"
}

Response:
{
  "access": "new-jwt-token"
}
```

## Form Validation

### Login Schema
```typescript
z.object({
  email: z.string().email(),
  password: z.string().min(8),
  company_id: z.string().uuid()
})
```

### Signup Schema
```typescript
z.object({
  full_name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  user_type: z.enum(["COMPANY_USER", "RETAILER"]),
  company_id: z.string().uuid().optional(),
  phone: z.string().optional(),
  business_name: z.string().optional(),
  gstin: z.string().optional()
})
```

## UI Components

### Input Field
```tsx
<Input
  type="text"
  className="bg-gray-900 text-white border border-gray-700"
  {...register("field_name")}
/>
{errors.field_name && (
  <p className="text-red-500 text-sm">{errors.field_name.message}</p>
)}
```

### Select/Dropdown
```tsx
<select
  className="bg-gray-900 text-white border border-gray-700 w-full h-10 px-3 rounded-md"
  {...register("company_id")}
>
  <option value="">-- Select Company --</option>
  {companies.map((company) => (
    <option key={company.id} value={company.id}>
      {company.name}
    </option>
  ))}
</select>
```

### Button with Loading State
```tsx
<Button
  type="submit"
  className="w-full bg-blue-600 hover:bg-blue-700"
  disabled={isSubmitting}
>
  {isSubmitting ? "Loading..." : "Submit"}
</Button>
```

### Tabs
```tsx
<Tabs value={userType} onValueChange={handleTabChange}>
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="RETAILER">Retailer</TabsTrigger>
    <TabsTrigger value="COMPANY_USER">Company User</TabsTrigger>
  </TabsList>
  
  <TabsContent value="RETAILER">
    {/* Retailer fields */}
  </TabsContent>
  
  <TabsContent value="COMPANY_USER">
    {/* Company user fields */}
  </TabsContent>
</Tabs>
```

## Storage Strategy

### LocalStorage Items
- `access_token` - JWT access token
- `refresh_token` - JWT refresh token
- `company_id` - Selected company UUID

### Security Considerations
- Never log tokens in production
- Clear tokens on logout
- Implement token refresh before expiry
- Use HTTPS for all API calls

## Error Handling

### Form Errors
Display validation errors inline below each field using Zod error messages.

### API Errors
```tsx
const [error, setError] = useState("");

// On API error
setError(result.detail || "An error occurred");

// Display
{error && (
  <div className="bg-red-900/20 border border-red-500 rounded p-3">
    <p className="text-red-500 text-sm">{error}</p>
  </div>
)}
```

### Success Messages
```tsx
const [message, setMessage] = useState("");

// On success
setMessage("Registration submitted successfully!");

// Display
{message && (
  <div className="bg-green-900/20 border border-green-500 rounded p-3">
    <p className="text-green-500 text-sm">{message}</p>
  </div>
)}
```

## Testing Checklist

### Login
- [ ] Email validation works
- [ ] Password minimum length enforced
- [ ] Company dropdown populated
- [ ] Company selection required
- [ ] Show/hide password toggle works
- [ ] Error messages display correctly
- [ ] Successful login redirects correctly
- [ ] Tokens stored in localStorage

### Signup - Retailer
- [ ] Tab switches correctly
- [ ] All required fields validated
- [ ] Company dropdown works (optional)
- [ ] Phone, business_name, gstin are optional
- [ ] Pending status message displays
- [ ] Redirects to login after 3 seconds

### Signup - Company User
- [ ] Tab switches correctly
- [ ] Required fields validated
- [ ] Company dropdown works
- [ ] Successful signup stores tokens
- [ ] Redirects based on role

## Notes for Backend Team

### Expected Payload Format
- Use the exact field names as specified in schemas
- Return `user_type` in login response
- Return `role` for COMPANY_USER types
- Set `status: PENDING` for RETAILER signups
- Include proper error messages in `detail` field

### Headers Required
```
Content-Type: application/json
Authorization: Bearer <access_token> (for authenticated requests)
```

### CORS Configuration
Ensure backend allows requests from frontend domain.

## Deployment Checklist
- [ ] Update API_URL in production
- [ ] Test all authentication flows
- [ ] Verify token storage/retrieval
- [ ] Check redirect logic for all user types
- [ ] Test error handling
- [ ] Verify form validation on all fields
- [ ] Test company dropdown loading
- [ ] Check mobile responsiveness
