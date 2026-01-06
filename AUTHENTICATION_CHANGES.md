# Authentication Update Summary

## What Was Changed

### 1. Dependencies Added
- `react-hook-form` - Form state management
- `zod` - Schema validation
- `@hookform/resolvers` - Bridge between React Hook Form and Zod

### 2. New Files Created

#### `lib/schemas/auth.ts`
Defines TypeScript + Zod schemas for:
- **loginSchema**: email, password, company_id validation
- **signupSchema**: full_name, email, password, user_type, and optional fields

#### `utils/auth_service.ts`
API service layer with functions for:
- `login()` - User authentication
- `signup()` - User registration
- `getCompanies()` - Fetch company list
- `refreshToken()` - Token refresh
- Token storage utilities

#### `AUTHENTICATION_GUIDE.md`
Complete documentation covering:
- Architecture overview
- API endpoints
- Form validation rules
- UI components
- Testing checklist

### 3. Modified Files

#### `components/login_form.tsx`
**Before:**
- Simple username/password form
- Manual role selection dropdown
- No validation
- Direct state management

**After:**
- Email-based login (instead of username)
- React Hook Form with Zod validation
- **Mandatory company_id selection**
- Fetches companies from API
- Real-time validation errors
- Improved UX with loading states
- Proper redirect based on user_type from API response

**Key Changes:**
```tsx
// Old approach
const [username, setUsername] = useState("");
const [role, setRole] = useState("manufacturer");

// New approach
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(loginSchema),
});
```

#### `app/authentication/signup/page.tsx`
**Before:**
- Single form with group dropdown
- Username field
- Confirm password field
- No distinction between user types

**After:**
- **Tab-based interface**: Retailer vs Company User
- Dynamic form fields based on selected tab
- React Hook Form with Zod validation
- RETAILER tab shows:
  - Company selector (optional)
  - Business name field
  - GSTIN field
- COMPANY_USER tab shows:
  - Simplified fields
  - Company selector (optional)
- Different submit behavior:
  - Retailers: Show pending approval message
  - Company users: Immediate login and redirect

**Key Changes:**
```tsx
// Tab system
<Tabs value={userType} onValueChange={handleTabChange}>
  <TabsList>
    <TabsTrigger value="RETAILER">Retailer</TabsTrigger>
    <TabsTrigger value="COMPANY_USER">Company User</TabsTrigger>
  </TabsList>
  {/* Dynamic content based on tab */}
</Tabs>
```

## Data Model Changes

### Login Payload
```typescript
// OLD
{
  username: string,
  password: string
}

// NEW
{
  email: string,
  password: string,
  company_id: string (UUID - REQUIRED)
}
```

### Signup Payload
```typescript
// OLD
{
  username: string,
  email: string,
  password: string,
  group_name: string
}

// NEW (RETAILER)
{
  full_name: string,
  email: string,
  password: string,
  user_type: "RETAILER",
  company_id?: string,
  phone?: string,
  business_name?: string,
  gstin?: string
}

// NEW (COMPANY_USER)
{
  full_name: string,
  email: string,
  password: string,
  user_type: "COMPANY_USER",
  company_id?: string,
  phone?: string
}
```

## API Endpoint Changes

### Required Backend Updates

#### Old Endpoints
- `POST /token/` - Login
- `POST /register/` - Signup
- `GET /groups/` - Fetch groups

#### New Endpoints Expected
- `POST /auth/login/` - Login with email + company_id
- `POST /auth/register/` - Signup with user_type
- `GET /api/company/discover/` - Get company list
- `POST /auth/refresh/` - Refresh tokens

### Expected Response Changes

**Login Response:**
```json
{
  "access": "jwt-token",
  "refresh": "refresh-token",
  "user_type": "RETAILER" | "COMPANY_USER",
  "role": "ADMIN" | "EMPLOYEE" | "ACCOUNTANT"
}
```

**Signup Response (Retailer):**
```json
{
  "status": "PENDING",
  "detail": "Registration submitted. Awaiting approval."
}
```

**Signup Response (Company User):**
```json
{
  "access": "jwt-token",
  "refresh": "refresh-token",
  "role": "EMPLOYEE"
}
```

## User Experience Improvements

### Login Page
1. ✅ Email validation in real-time
2. ✅ Password show/hide toggle
3. ✅ Company dropdown with actual data
4. ✅ Inline validation errors
5. ✅ Loading state during submission
6. ✅ Proper error messages from API

### Signup Page
1. ✅ Clean tab interface for user type selection
2. ✅ Dynamic form fields based on user type
3. ✅ Optional vs required fields clearly marked
4. ✅ Real-time validation
5. ✅ Different success flows for each user type
6. ✅ Better visual feedback (success/error boxes)

## Validation Rules

### Email
- Must be valid email format
- Example: `user@example.com`

### Password
- Minimum 8 characters
- No specific pattern required (can be enhanced)

### Full Name
- Minimum 3 characters

### Company ID
- Must be valid UUID format
- Selected from dropdown

### Optional Fields
- Phone, business_name, gstin - no validation when empty

## Redirect Logic

### After Login
```
RETAILER → /retailer
ADMIN/ACCOUNTANT → /manufacturer
EMPLOYEE → /employee
```

### After Signup
```
RETAILER → Show message → /authentication (after 3s)
COMPANY_USER → Based on role (same as login)
```

## Storage Management

### LocalStorage Keys
- `access_token` - JWT access token
- `refresh_token` - JWT refresh token  
- `company_id` - Selected company UUID

### When Stored
- Login: After successful authentication
- Signup: Only for approved COMPANY_USER registrations

## Breaking Changes

⚠️ **Important**: These changes require backend updates:

1. **Login endpoint** must accept `email` and `company_id` instead of `username`
2. **Login response** must include `user_type` and `role`
3. **Signup endpoint** must handle `user_type` field
4. **Retailer signups** should return pending status
5. **Company discovery endpoint** must be available at `/api/company/discover/`

## Testing Instructions

### Manual Testing - Login
1. Navigate to `/authentication`
2. Enter invalid email → Check validation error
3. Enter short password → Check validation error
4. Don't select company → Check validation error
5. Select company and submit → Check redirect
6. Check localStorage for tokens and company_id

### Manual Testing - Signup (Retailer)
1. Navigate to `/authentication/signup`
2. Select "Retailer" tab
3. Fill required fields (name, email, password)
4. Optionally select company, enter business details
5. Submit → Check pending message appears
6. Verify redirect to login after 3 seconds

### Manual Testing - Signup (Company User)
1. Navigate to `/authentication/signup`
2. Select "Company User" tab
3. Fill required fields
4. Submit → Check immediate redirect
5. Verify tokens in localStorage

## Migration Guide

If you have existing users:

1. **Email Migration**: If using username-based auth, migrate to email-based
2. **Company Assignment**: Ensure all users have a company_id assigned
3. **User Type**: Classify existing users as RETAILER or COMPANY_USER
4. **Role Assignment**: Set appropriate roles for COMPANY_USER types

## Future Enhancements

Potential improvements (not implemented):

- [ ] Password strength indicator
- [ ] Email verification flow
- [ ] Remember me checkbox
- [ ] Social login (Google, Microsoft)
- [ ] Two-factor authentication
- [ ] Password reset functionality (forgot-password page exists but not integrated)
- [ ] Account activation emails
- [ ] Profile picture upload during signup

## Support

For issues or questions:
1. Check `AUTHENTICATION_GUIDE.md` for detailed docs
2. Review validation schemas in `lib/schemas/auth.ts`
3. Check API service in `utils/auth_service.ts`
4. Verify backend endpoints are correctly implemented
