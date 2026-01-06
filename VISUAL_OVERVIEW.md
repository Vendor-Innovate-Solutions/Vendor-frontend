# Stock Management System - Visual Overview

## 🎯 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    STOCK DASHBOARD                               │
│                  /manufacturer/stockCount                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NAVIGATION BAR                                │
│  [Table] [Charts] [Warehouses] [Balance] [Movements]           │
│                    [Transfers] [Items]                           │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────┐         ┌──────────────────────┐
│   EXISTING VIEWS     │         │    NEW VIEWS         │
│                      │         │                      │
│  • Table View        │         │  • Warehouses        │
│  • Chart View        │         │  • Stock Balance     │
│  • Side Panel        │         │  • Movements         │
│                      │         │  • Transfers         │
│                      │         │  • Stock Items       │
└──────────────────────┘         └──────────────────────┘
```

---

## 📦 Component Hierarchy

```
StockCountPage (page.tsx)
│
├─ NavigationBar
│  └─ 7 tabs with icons and active state
│
├─ renderView() → Conditional Rendering:
│
│  ├─ (activeView === 'table' || 'charts')
│  │  ├─ StockOverview
│  │  │  ├─ StockTable (table view)
│  │  │  └─ StockCharts (chart view)
│  │  └─ SidePanel
│  │     ├─ Total Products
│  │     ├─ Low Stock Count
│  │     └─ Category Breakdown
│  │
│  ├─ (activeView === 'godowns')
│  │  └─ GodownManagement
│  │     ├─ Godown Card Grid
│  │     └─ Add/Edit Modal
│  │
│  ├─ (activeView === 'balance')
│  │  └─ StockBalance
│  │     ├─ Filter Section
│  │     ├─ Grouped Balance Cards
│  │     └─ Detail Modal
│  │
│  ├─ (activeView === 'movements')
│  │  └─ StockMovements
│  │     ├─ Filter Section
│  │     ├─ Movement List
│  │     └─ Summary Stats
│  │
│  ├─ (activeView === 'transfers')
│  │  └─ StockTransfer
│  │     ├─ Transfer Form
│  │     ├─ Transfer Preview
│  │     └─ Info Box
│  │
│  └─ (activeView === 'items')
│     └─ StockItems
│        ├─ Filter Section
│        ├─ Items Table
│        └─ Add/Edit Modal
│
└─ Add Product Modal (for table/chart views)
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ User Action (Click, Input, Submit)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   REACT COMPONENT                            │
│                                                              │
│  1. Event Handler                                           │
│  2. State Update (loading = true)                           │
│  3. getAuthToken() from localStorage                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ fetch(API_URL + endpoint, {headers})
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API                               │
│                                                              │
│  • Authentication Check (JWT)                               │
│  • Business Logic                                           │
│  • Database Operations                                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ JSON Response
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   REACT COMPONENT                            │
│                                                              │
│  1. Parse Response                                          │
│  2. Update State (data, loading = false)                    │
│  3. Handle Errors (if any)                                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Re-render
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                           │
│                  (Updated with new data)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗺️ User Journey Maps

### Journey 1: Managing Inventory Locations
```
Start
  │
  ├─> Navigate to Stock Dashboard
  │
  ├─> Click "Warehouses" Tab
  │   │
  │   ├─> View Existing Warehouses (Card Grid)
  │   │
  │   └─> Click "+ Add Warehouse"
  │       │
  │       ├─> Fill Form (Name, Location, Status)
  │       │
  │       ├─> Submit
  │       │
  │       └─> Success → Warehouse Created ✅
  │
  └─> End
```

### Journey 2: Checking Stock Levels
```
Start
  │
  ├─> Navigate to Stock Dashboard
  │
  ├─> Click "Stock Balance" Tab
  │   │
  │   ├─> Apply Filters (Optional)
  │   │   ├─> Select Warehouse
  │   │   └─> Select Product
  │   │
  │   ├─> View Grouped Stock by Product
  │   │
  │   └─> Click "View Details" on Product
  │       │
  │       └─> See Breakdown by Warehouse ✅
  │
  └─> End
```

### Journey 3: Transferring Stock
```
Start
  │
  ├─> Navigate to Stock Dashboard
  │
  ├─> Click "Transfers" Tab
  │   │
  │   ├─> Select Product
  │   │
  │   ├─> Enter Quantity
  │   │
  │   ├─> Select From Warehouse
  │   │
  │   ├─> Select To Warehouse
  │   │
  │   ├─> Set Transfer Date
  │   │
  │   ├─> Add Notes (Optional)
  │   │
  │   ├─> Review Preview
  │   │
  │   └─> Submit Transfer
  │       │
  │       └─> Success → Stock Transferred ✅
  │
  └─> End
```

---

## 🎨 UI Component Library

### Color Palette
```
Background Colors:
  • Primary BG:     #000000 (black)
  • Card BG:        #1a1a1a (gray-900)
  • Input BG:       #2d2d2d (gray-800)
  • Border:         #4a4a4a (gray-700)

Text Colors:
  • Primary Text:   #93c5fd (blue-300)
  • Heading:        #60a5fa (blue-400)
  • Body Text:      #ffffff (white)
  • Muted Text:     #9ca3af (gray-400)

Accent Colors:
  • Primary:        #1d4ed8 (blue-700)
  • Hover:          #1e40af (blue-800)
  • Success:        #22c55e (green-500)
  • Error:          #ef4444 (red-500)
  • Warning:        #eab308 (yellow-500)
```

### Icon Usage
```
Warehouse:        🏢 Warehouse icon
Package:          📦 Package icon
History:          🕒 History/Clock icon
Transfer:         ⇄  ArrowRightLeft icon
Stock Items:      📋 Package2 icon
Chart:            📊 BarChart3 icon
Table:            📄 Table icon
Add:              ➕ Plus icon
Edit:             ✏️  Pencil icon
Delete:           🗑️  Trash2 icon
View:             👁️  Eye icon
Success:          ✅ CheckCircle icon
Warning:          ⚠️  AlertCircle icon
```

---

## 🔌 API Integration Map

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENTS                       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    API SERVICE LAYER                         │
│                   (utils/auth_fn.ts)                         │
│                                                              │
│  • getAuthToken()                                           │
│  • refreshAccessToken()                                     │
│  • fetchWithAuth()                                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND ENDPOINTS                         │
│                   (API_URL + path)                           │
│                                                              │
│  Godowns:                                                   │
│    GET    /inventory/godowns/                              │
│    POST   /inventory/godowns/                              │
│    PUT    /inventory/godowns/{id}/                         │
│    DELETE /inventory/godowns/{id}/                         │
│                                                              │
│  Stock Balance:                                             │
│    GET    /inventory/balances/                             │
│    GET    /inventory/balance/?product_id={id}              │
│                                                              │
│  Movements:                                                 │
│    GET    /inventory/movements/                            │
│                                                              │
│  Transfers:                                                 │
│    POST   /inventory/transfers/                            │
│                                                              │
│  Stock Items:                                               │
│    GET    /inventory/items/                                │
│    POST   /inventory/items/                                │
│    PUT    /inventory/items/{id}/                           │
│    DELETE /inventory/items/{id}/                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 State Management Overview

### Component State Pattern
```typescript
const [data, setData] = useState<Type[]>([]);         // Main data
const [loading, setLoading] = useState(true);          // Loading flag
const [error, setError] = useState('');                // Error message
const [showModal, setShowModal] = useState(false);     // Modal visibility
const [formData, setFormData] = useState<Form>({...}); // Form state
const [filters, setFilters] = useState<Filters>({...});// Filter state
```

### State Flow
```
Initial State (Empty)
  │
  ▼
Loading State (loading = true)
  │
  ▼
API Call
  │
  ├─> Success
  │   └─> Data State (data = response)
  │
  └─> Error
      └─> Error State (error = message)
  │
  ▼
Rendered State (loading = false)
```

---

## 🔍 Filter & Search Flow

```
┌──────────────────────────────────────┐
│      FILTER COMPONENT                │
│                                      │
│  [Warehouse ▼] [Product ▼] [Status ▼]│
└──────────────────────────────────────┘
              │
              │ onChange event
              ▼
┌──────────────────────────────────────┐
│    UPDATE FILTER STATE               │
│  setFilters({...filters, field})     │
└──────────────────────────────────────┘
              │
              │ useEffect dependency
              ▼
┌──────────────────────────────────────┐
│    TRIGGER API CALL                  │
│  fetchData() with query params       │
└──────────────────────────────────────┘
              │
              │ API response
              ▼
┌──────────────────────────────────────┐
│    UPDATE DATA STATE                 │
│  setData(filteredResults)            │
└──────────────────────────────────────┘
              │
              │ Re-render
              ▼
┌──────────────────────────────────────┐
│    DISPLAY FILTERED RESULTS          │
└──────────────────────────────────────┘
```

---

## 🛡️ Error Handling Flow

```
API Call
  │
  ├─> Network Error
  │   └─> catch block → setError("Network error")
  │
  ├─> 401 Unauthorized
  │   └─> refreshAccessToken() → Retry
  │       │
  │       ├─> Success → Continue
  │       └─> Fail → Redirect to Login
  │
  ├─> 400 Bad Request
  │   └─> Parse error response → setError(message)
  │
  ├─> 404 Not Found
  │   └─> setError("Resource not found")
  │
  ├─> 500 Server Error
  │   └─> setError("Server error")
  │
  └─> 200 Success
      └─> Parse data → setData(response)
```

---

## 📱 Responsive Breakpoints

```
Mobile First Approach:

Mobile (default):
  • 1 column grids
  • Stacked forms
  • Horizontal scroll navigation

Tablet (md: 768px):
  • 2 column grids
  • Side-by-side forms
  • Wrapped navigation

Desktop (lg: 1024px):
  • 3 column grids
  • Wide forms
  • Full navigation bar

Extra Large (xl: 1280px):
  • 4+ column grids
  • Expanded layouts
```

---

## 🎯 Performance Optimization

```
1. Conditional Rendering
   └─> Only render active view component

2. useEffect Dependencies
   └─> Re-fetch only when filters change

3. Lazy Loading
   └─> Components loaded on demand

4. Debouncing (Future)
   └─> Delay API calls on rapid inputs

5. Caching (Future)
   └─> Store frequently accessed data
```

---

## 📈 Future Scalability

```
Current Architecture:
  ├─ Modular components (easy to extend)
  ├─ Consistent patterns (reusable)
  ├─ Type-safe (TypeScript)
  └─ Well documented

Easy to Add:
  ├─ New tabs/views
  ├─ Additional filters
  ├─ More API endpoints
  ├─ Advanced analytics
  └─ Export features
```

---

**Visual Overview Version**: 1.0  
**Last Updated**: January 6, 2026
