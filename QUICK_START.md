# Quick Start Guide - Authentication System

## 🚀 What's New

Your login and signup pages have been completely redesigned with:
- ✅ Email-based authentication
- ✅ React Hook Form + Zod validation
- ✅ Tab-based signup (Retailer vs Company User)
- ✅ Mandatory company selection
- ✅ Real-time form validation
- ✅ Better UX with loading states and error messages

## 📦 Installation Complete

Dependencies installed:
```bash
npm install react-hook-form zod @hookform/resolvers
```

## 📁 Files Modified & Created

### Created
- ✅ `lib/schemas/auth.ts` - Validation schemas
- ✅ `utils/auth_service.ts` - API service layer
- ✅ `AUTHENTICATION_GUIDE.md` - Full documentation
- ✅ `AUTHENTICATION_CHANGES.md` - Summary of changes
- ✅ `QUICK_START.md` - This file

### Modified
- ✅ `components/login_form.tsx` - New login form
- ✅ `app/authentication/signup/page.tsx` - New signup page

## 🎯 How to Use

### Login Page (`/authentication`)

**Fields:**
1. Email (required, must be valid email)
2. Password (required, min 8 chars)
3. Company (required, dropdown selection)

**Example:**
```
Email: john@example.com
Password: MyPass123
Company: [Select from dropdown]
```

### Signup Page (`/authentication/signup`)

**Two Tabs:**

#### 1. Retailer Tab
For external customers/retailers.

**Required:**
- Full Name
- Email
- Password

**Optional:**
- Phone
- Select Supplier Company
- Business Name
- GSTIN

**After Submit:**
- Shows: "Registration submitted successfully! You'll be notified after approval."
- Redirects to login page after 3 seconds
- User account status: PENDING (awaits admin approval)

#### 2. Company User Tab
For internal employees.

**Required:**
- Full Name
- Email
- Password

**Optional:**
- Phone
- Select Company

**After Submit:**
- Immediate account creation
- Auto-login with tokens stored
- Redirects based on assigned role

## 🔧 Backend Requirements

Your backend MUST implement these endpoints:

### 1. Login Endpoint
```
POST /auth/login/

Request Body:
{
  "email": "user@example.com",
  "password": "password123",
  "company_id": "550e8400-e29b-41d4-a716-446655440000"
}

Response (Success):
{
  "access": "eyJhbGc...",
  "refresh": "eyJhbGc...",
  "user_type": "RETAILER",
  "role": "ADMIN"
}
```

### 2. Signup Endpoint
```
POST /auth/register/

Request Body (Retailer):
{
  "full_name": "John Doe",
  "email": "john@store.com",
  "password": "SecurePass123",
  "user_type": "RETAILER",
  "company_id": "550e8400-e29b-41d4-a716-446655440000",
  "phone": "1234567890",
  "business_name": "John's Store",
  "gstin": "GST123456"
}

Request Body (Company User):
{
  "full_name": "Jane Smith",
  "email": "jane@company.com",
  "password": "SecurePass123",
  "user_type": "COMPANY_USER",
  "company_id": "550e8400-e29b-41d4-a716-446655440000"
}

Response (Retailer - Pending):
{
  "status": "PENDING",
  "detail": "Registration submitted"
}

Response (Company User - Approved):
{
  "access": "eyJhbGc...",
  "refresh": "eyJhbGc...",
  "role": "EMPLOYEE"
}
```

### 3. Company List Endpoint
```
GET /api/company/discover/

Response:
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "ABC Manufacturing"
  },
  {
    "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "name": "XYZ Industries"
  }
]
```

### 4. Token Refresh Endpoint
```
POST /auth/refresh/

Request Body:
{
  "refresh": "eyJhbGc..."
}

Response:
{
  "access": "eyJhbGc..."
}
```

## 🔍 Testing Checklist

### Test Login
- [ ] Enter invalid email format → See error "Please enter a valid email address"
- [ ] Enter password less than 8 chars → See error "Password must be at least 8 characters"
- [ ] Don't select company → See error "Please select a valid company"
- [ ] Submit valid form → Redirects to correct dashboard
- [ ] Check browser localStorage → Should have `access_token`, `refresh_token`, `company_id`

### Test Signup - Retailer
- [ ] Switch to "Retailer" tab
- [ ] Enter short name → See validation error
- [ ] Enter invalid email → See validation error
- [ ] Enter short password → See validation error
- [ ] Fill all required fields → Submit button enabled
- [ ] Submit form → See success message
- [ ] Wait 3 seconds → Auto-redirect to login

### Test Signup - Company User
- [ ] Switch to "Company User" tab
- [ ] Notice different form fields
- [ ] Submit with valid data → Immediate redirect
- [ ] Check localStorage → Should have tokens

## 🎨 UI Components Used

All components are from `components/ui/` (shadcn/ui):
- `Button` - Submit buttons
- `Input` - Text fields
- `Label` - Field labels
- `Card` - Form container
- `Tabs` - Signup type selector

Styling: Tailwind CSS with dark theme

## 📊 Data Flow

### Login Flow
```
User Input → Zod Validation → API Call → Store Tokens → Redirect
```

### Signup Flow (Retailer)
```
User Input → Zod Validation → API Call → Show Message → Redirect to Login
```

### Signup Flow (Company User)
```
User Input → Zod Validation → API Call → Store Tokens → Redirect to Dashboard
```

## 🔐 Security Features

- ✅ Client-side validation (Zod)
- ✅ Password show/hide toggle
- ✅ Tokens stored in localStorage (consider httpOnly cookies in production)
- ✅ Company ID validation (UUID format)
- ⚠️ Remember to implement HTTPS in production
- ⚠️ Consider implementing CSRF protection

## 🐛 Common Issues & Solutions

### Issue: "Company dropdown is empty"
**Solution:** Check that `GET /api/company/discover/` endpoint is working and returning data.

### Issue: "Login fails with 'Invalid company_id'"
**Solution:** Ensure the backend expects `company_id` field and validates it as UUID.

### Issue: "Validation errors not showing"
**Solution:** Check browser console. Ensure Zod schemas are correctly imported.

### Issue: "Redirect not working after login"
**Solution:** 
1. Check that API returns `user_type` and `role` fields
2. Verify routes exist (`/manufacturer`, `/retailer`, `/employee`)

### Issue: "Form submits even with errors"
**Solution:** This shouldn't happen with Zod validation. Check if `resolver: zodResolver(schema)` is set correctly.

## 📚 Documentation Files

1. **QUICK_START.md** (this file) - Quick overview
2. **AUTHENTICATION_GUIDE.md** - Complete technical documentation
3. **AUTHENTICATION_CHANGES.md** - Detailed changelog

## 🚦 Next Steps

1. **Update Backend**: Implement the required endpoints
2. **Test Locally**: Run dev server and test all flows
3. **Update API_URL**: Check `utils/auth_fn.ts` for the correct API base URL
4. **Review Redirects**: Ensure all dashboard routes exist
5. **Add CORS**: Configure backend to accept requests from frontend domain
6. **Production Deploy**: Use environment variables for API_URL

## 💡 Pro Tips

- Use the browser DevTools Network tab to debug API calls
- Check localStorage in DevTools Application tab for stored tokens
- The form won't submit if validation fails (Zod blocks it)
- Company dropdown fetches on page load (check console for errors)
- RETAILER signups require admin approval in backend
- COMPANY_USER signups are immediate (if backend allows)

## 🆘 Need Help?

1. Check validation schemas: `lib/schemas/auth.ts`
2. Review API service: `utils/auth_service.ts`
3. Read full guide: `AUTHENTICATION_GUIDE.md`
4. Check for TypeScript errors in VS Code
5. Verify no console errors in browser DevTools

## ✨ Features Ready to Use

- ✅ Real-time validation
- ✅ Show/hide password
- ✅ Loading states
- ✅ Error handling
- ✅ Success messages
- ✅ Auto-redirect
- ✅ Company selection
- ✅ Tab switching
- ✅ Responsive design
- ✅ Dark theme UI

---

**Happy Coding! 🎉**

If you encounter any issues, check the detailed documentation in `AUTHENTICATION_GUIDE.md` or review the implementation in the modified component files.
