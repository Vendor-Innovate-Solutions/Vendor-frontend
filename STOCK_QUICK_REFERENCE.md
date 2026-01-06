# Stock Management - Quick Reference Guide

## 🚀 Quick Start

### New Navigation Tabs Added
The Stock Dashboard now has **7 navigation tabs**:

1. **Table View** - Original product listing table
2. **Chart View** - Original analytics charts
3. **Warehouses** - Manage warehouse locations
4. **Stock Balance** - View inventory levels
5. **Movements** - Track stock IN/OUT history
6. **Transfers** - Transfer between warehouses
7. **Stock Items** - Manage individual stock items

---

## 📋 Component Quick Reference

### GodownManagement.tsx
**Purpose**: CRUD operations for warehouses

**Key Functions**:
```typescript
fetchGodowns()      // Load all warehouses
handleSubmit()      // Create/Update warehouse
handleDelete(id)    // Delete warehouse
handleEdit(godown)  // Populate edit form
```

**State**:
- `godowns`: Array of warehouse objects
- `showModal`: Controls add/edit modal
- `editingGodown`: Current warehouse being edited
- `formData`: Form fields (name, location, is_active)

---

### StockBalance.tsx
**Purpose**: Display stock balances across warehouses

**Key Functions**:
```typescript
fetchBalances()             // Load balances with filters
fetchDetailedBalance(id)    // Get product breakdown
```

**Filters**:
- `godown_id`: Filter by warehouse
- `product_id`: Filter by product

**Features**:
- Grouped display by product
- Total quantity calculation
- Warehouse breakdown modal

---

### StockMovements.tsx
**Purpose**: Track stock movement history

**Key Functions**:
```typescript
fetchMovements()    // Load movements with filters
formatDate()        // Date formatting utility
formatDateTime()    // DateTime formatting utility
```

**Filters**:
- `product_id`: Filter by product
- `godown_id`: Filter by warehouse
- `start_date`: From date (YYYY-MM-DD)
- `end_date`: To date (YYYY-MM-DD)

**Movement Types**:
- `IN`: Stock incoming (green indicator)
- `OUT`: Stock outgoing (red indicator)

---

### StockTransfer.tsx
**Purpose**: Transfer stock between warehouses

**Key Functions**:
```typescript
handleSubmit()       // Process transfer
getProductName(id)   // Helper for display
getGodownName(id)    // Helper for display
```

**Validation**:
```typescript
// Prevents same source/destination
if (from_godown_id === to_godown_id) → Error

// Ensures positive quantity
if (quantity <= 0) → Error
```

**Transfer Preview**:
Shows visual representation before submission with arrow icon.

---

### StockItems.tsx
**Purpose**: Manage individual stock items

**Key Functions**:
```typescript
fetchStockItems()   // Load items with filters
handleSubmit()      // Create/Update item
handleDelete(id)    // Delete item
handleEdit(item)    // Populate edit form
```

**Filters**:
- `godown`: Filter by warehouse
- `product`: Filter by product
- `status`: Filter by status (AVAILABLE, RESERVED, LOW)

**Table Columns**:
- Product | Warehouse | Quantity | Unit | Status | Actions

---

## 🔗 API Endpoints Map

| Component | Primary Endpoint | Method | Purpose |
|-----------|-----------------|---------|---------|
| GodownManagement | `/inventory/godowns/` | GET, POST, PUT, DELETE | Warehouse CRUD |
| StockBalance | `/inventory/balances/` | GET | List balances |
| StockBalance (Detail) | `/inventory/balance/` | GET | Product breakdown |
| StockMovements | `/inventory/movements/` | GET | Movement history |
| StockTransfer | `/inventory/transfers/` | POST | Create transfer |
| StockItems | `/inventory/items/` | GET, POST, PUT, DELETE | Item CRUD |

---

## 🎨 UI Patterns Used

### Modal Pattern
```typescript
const [showModal, setShowModal] = useState(false);
const [formData, setFormData] = useState({...});

// Open modal
setShowModal(true);

// Close modal
setShowModal(false);
resetForm();
```

### Filter Pattern
```typescript
const [filters, setFilters] = useState({
  field1: '',
  field2: '',
});

useEffect(() => {
  fetchData(); // Re-fetch when filters change
}, [filters]);
```

### CRUD Pattern
```typescript
// Create
POST /endpoint/ → Add to list

// Read
GET /endpoint/ → Display list
GET /endpoint/{id}/ → Display detail

// Update
PUT /endpoint/{id}/ → Update in list

// Delete
DELETE /endpoint/{id}/ → Remove from list
```

---

## 🛠️ Common Utilities

### Authentication
```typescript
import { getAuthToken, refreshAccessToken } from '@/utils/auth_fn';

let token = await getAuthToken();
// If 401, auto-refresh:
if (response.status === 401) {
  token = await refreshAccessToken();
  // Retry request
}
```

### Company ID
```typescript
const companyId = localStorage.getItem('company_id');
```

### Date Formatting
```typescript
// In StockMovements.tsx
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
```

---

## 🎯 Key State Management Patterns

### Loading State
```typescript
const [loading, setLoading] = useState(true);

// Before fetch
setLoading(true);

// After fetch (in finally block)
setLoading(false);

// Render
if (loading) return <div>Loading...</div>;
```

### Error State
```typescript
const [error, setError] = useState('');

// On error
setError('Error message');

// Clear error
setError('');

// Render
{error && <div className="text-red-400">{error}</div>}
```

### Success State
```typescript
const [success, setSuccess] = useState('');

// On success
setSuccess('Operation completed!');

// Clear after timeout (optional)
setTimeout(() => setSuccess(''), 3000);

// Render
{success && <div className="text-green-400">{success}</div>}
```

---

## 🔍 Debugging Tips

### Check API Response
```typescript
const response = await fetch(url, options);
const data = await response.json();
console.log('API Response:', data); // Debug log
```

### Check Authentication
```typescript
const token = localStorage.getItem('access_token');
console.log('Token:', token ? 'Present' : 'Missing');
```

### Check Company ID
```typescript
const companyId = localStorage.getItem('company_id');
console.log('Company ID:', companyId);
```

### Network Tab
- Open DevTools → Network tab
- Filter by "Fetch/XHR"
- Check request/response for each API call

---

## 📱 Responsive Design Notes

All components use responsive grid layouts:
```typescript
// Mobile: 1 column
// Tablet: 2 columns
// Desktop: 3 columns
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
```

Navigation bar uses horizontal scroll on mobile:
```typescript
className="flex gap-2 overflow-x-auto"
```

---

## 🧪 Testing Commands

```bash
# Build project
npm run build

# Development server
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## 📦 New Dependencies

No new dependencies added! All features use existing packages:
- `lucide-react` - Icons (already installed)
- `react` - Core framework
- TypeScript utilities from existing codebase

---

## 🔐 Security Notes

- All API calls require JWT authentication
- Tokens auto-refresh on expiry
- Delete operations require confirmation
- Form validation prevents invalid data submission
- Company ID scoped to logged-in user

---

## 📞 Support

For issues or questions:
1. Check API_DOCUMENTATION.md for endpoint details
2. Review STOCK_MANAGEMENT_FEATURES.md for feature docs
3. Check browser console for errors
4. Verify backend API is running and accessible

---

**Quick Reference Version**: 1.0  
**Last Updated**: January 6, 2026
