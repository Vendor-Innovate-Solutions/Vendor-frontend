# Stock Management System - Complete Feature Documentation

## Overview
This document provides comprehensive documentation for the enhanced Stock Management System with full inventory control capabilities aligned with the backend API.

---

## Table of Contents
1. [Features Summary](#features-summary)
2. [API Integration](#api-integration)
3. [Component Architecture](#component-architecture)
4. [User Flows](#user-flows)
5. [Implementation Details](#implementation-details)

---

## Features Summary

### ✅ Existing Features (Enhanced)
- **Table View**: Product stock listing with availability, sold, and demanded quantities
- **Chart View**: Visual analytics for stock data
- **Add Product**: Modal form for creating new products with GST rates and categories

### 🆕 New Features Implemented

#### 1. **Godown (Warehouse) Management**
- **Path**: `/manufacturer/stockCount` → Warehouses Tab
- **Component**: `GodownManagement.tsx`
- **Features**:
  - ✅ Create new warehouses with name and location
  - ✅ Edit existing warehouse details
  - ✅ Delete warehouses (with confirmation)
  - ✅ Toggle active/inactive status
  - ✅ Card-based grid layout for easy viewing
  - ✅ Real-time CRUD operations with API sync

#### 2. **Stock Balance View**
- **Path**: `/manufacturer/stockCount` → Stock Balance Tab
- **Component**: `StockBalance.tsx`
- **Features**:
  - ✅ View total stock across all warehouses
  - ✅ Filter by warehouse or product
  - ✅ Grouped display by product name
  - ✅ Detailed breakdown by warehouse location
  - ✅ Modal view for detailed product balance
  - ✅ Real-time quantity tracking

#### 3. **Stock Movements History**
- **Path**: `/manufacturer/stockCount` → Movements Tab
- **Component**: `StockMovements.tsx`
- **Features**:
  - ✅ Track all IN/OUT stock movements
  - ✅ Filter by product, warehouse, and date range
  - ✅ Visual indicators for movement type (green for IN, red for OUT)
  - ✅ Reference type display (Purchase Order, Sales Order, etc.)
  - ✅ Movement date and timestamp tracking
  - ✅ Summary statistics (total movements, IN count, OUT count)

#### 4. **Stock Transfer Between Warehouses**
- **Path**: `/manufacturer/stockCount` → Transfers Tab
- **Component**: `StockTransfer.tsx`
- **Features**:
  - ✅ Transfer stock between warehouses
  - ✅ Select product, source, and destination warehouses
  - ✅ Specify quantity and transfer date
  - ✅ Add optional notes for transfer
  - ✅ Visual transfer preview before submission
  - ✅ Validation (prevents same source/destination, negative quantities)
  - ✅ Success confirmation messages

#### 5. **Stock Items Management**
- **Path**: `/manufacturer/stockCount` → Stock Items Tab
- **Component**: `StockItems.tsx`
- **Features**:
  - ✅ Full CRUD operations for stock items
  - ✅ Link products to specific warehouses
  - ✅ Set quantities and units
  - ✅ Filter by warehouse, product, or status
  - ✅ Table view with edit/delete actions
  - ✅ Status badges (Available, Reserved, Low Stock)

---

## API Integration

### Endpoints Used

#### **Godown Management**
```
GET    /api/inventory/godowns/              - List all warehouses
POST   /api/inventory/godowns/              - Create warehouse
GET    /api/inventory/godowns/{id}/         - Get warehouse details
PUT    /api/inventory/godowns/{id}/         - Update warehouse
DELETE /api/inventory/godowns/{id}/         - Delete warehouse
```

**Request Body (POST/PUT)**:
```json
{
  "name": "Main Warehouse",
  "location": "Mumbai, Maharashtra",
  "is_active": true
}
```

#### **Stock Balance**
```
GET /api/inventory/balances/?godown_id={id}&product_id={id}  - List all balances
GET /api/inventory/balance/?product_id={id}                  - Get detailed balance
```

**Response**:
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
    }
  ]
}
```

#### **Stock Movements**
```
GET /api/inventory/movements/?product_id={id}&godown_id={id}&start_date={date}&end_date={date}
```

**Response**:
```json
[
  {
    "id": "uuid",
    "product_name": "Product Name",
    "godown_name": "Main Warehouse",
    "movement_type": "IN",
    "quantity": "50.000",
    "reference_type": "PURCHASE_ORDER",
    "movement_date": "2025-01-05",
    "created_at": "2025-01-05T10:30:00Z"
  }
]
```

#### **Stock Transfer**
```
POST /api/inventory/transfers/
```

**Request Body**:
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

**Response**:
```json
{
  "id": "uuid",
  "status": "COMPLETED",
  "message": "Stock transferred successfully"
}
```

#### **Stock Items**
```
GET    /api/inventory/items/?godown={id}&product={id}&status={status}  - List items
POST   /api/inventory/items/                                            - Create item
GET    /api/inventory/items/{id}/                                       - Get item
PUT    /api/inventory/items/{id}/                                       - Update item
DELETE /api/inventory/items/{id}/                                       - Delete item
```

**Request Body (POST/PUT)**:
```json
{
  "product_id": "product-uuid",
  "godown_id": "godown-uuid",
  "quantity": "50.000",
  "unit": "PCS"
}
```

---

## Component Architecture

### File Structure
```
app/manufacturer/stockCount/
  └── page.tsx                    # Main page with view switching

components/manufacturer/stockcount/
  ├── NavigationBar.tsx           # Enhanced tab navigation (7 tabs)
  ├── StockOverview.tsx           # Original table/chart views
  ├── SidePanel.tsx               # Statistics sidebar
  ├── GodownManagement.tsx        # NEW: Warehouse CRUD
  ├── StockBalance.tsx            # NEW: Balance tracking
  ├── StockMovements.tsx          # NEW: Movement history
  ├── StockTransfer.tsx           # NEW: Transfer between warehouses
  ├── StockItems.tsx              # NEW: Stock items management
  ├── data.tsx                    # Data fetching hooks
  └── utils.tsx                   # Utility functions
```

### Component Relationships
```
StockCountPage
  ├── NavigationBar (controls activeView state)
  ├── renderView() → switches between:
      ├── StockOverview + SidePanel (table/charts)
      ├── GodownManagement
      ├── StockBalance
      ├── StockMovements
      ├── StockTransfer
      └── StockItems
```

---

## User Flows

### Flow 1: Managing Warehouses
```
1. Navigate to Stock Dashboard
2. Click "Warehouses" tab
3. Click "+ Add Warehouse"
4. Fill in warehouse details:
   - Name (e.g., "Main Warehouse")
   - Location (e.g., "Mumbai, Maharashtra")
   - Active status checkbox
5. Submit → Warehouse created
6. View in card grid
7. Click "Edit" to modify or "Delete" to remove
```

### Flow 2: Viewing Stock Balance
```
1. Navigate to "Stock Balance" tab
2. Apply filters:
   - Select warehouse (optional)
   - Select product (optional)
3. View grouped stock by product
4. See total quantity across all warehouses
5. Click "View Details" for detailed breakdown
6. Modal shows stock in each warehouse
```

### Flow 3: Tracking Stock Movements
```
1. Navigate to "Movements" tab
2. Apply filters:
   - Product filter
   - Warehouse filter
   - Date range (from/to)
3. View movement history:
   - Green arrow = Stock IN
   - Red arrow = Stock OUT
4. See reference type and dates
5. View summary statistics at bottom
```

### Flow 4: Transferring Stock
```
1. Navigate to "Transfers" tab
2. Select product from dropdown
3. Enter transfer quantity
4. Select "From Warehouse"
5. Select "To Warehouse" (different from source)
6. Set transfer date
7. Add optional notes
8. Review transfer preview
9. Click "Transfer Stock"
10. Confirmation message appears
```

### Flow 5: Managing Stock Items
```
1. Navigate to "Stock Items" tab
2. Apply filters if needed
3. Click "+ Add Stock Item"
4. Select product and warehouse
5. Enter quantity and unit
6. Submit → Item created
7. View in table format
8. Edit quantities or delete items as needed
```

---

## Implementation Details

### Authentication & Error Handling
All components implement:
- JWT token authentication
- Automatic token refresh on 401 errors
- Error state management with user-friendly messages
- Loading states during API calls

### State Management
```typescript
// Each component maintains local state for:
- Data fetching (useState)
- Loading status (useState)
- Error messages (useState)
- Form data (useState)
- Modal visibility (useState)
```

### Form Validation
- **Required fields**: Product, Warehouse, Quantity
- **Quantity validation**: Must be > 0
- **Transfer validation**: Source ≠ Destination
- **Date validation**: Valid date format required

### UI/UX Features
- **Dark theme**: Consistent with existing design
- **Responsive design**: Grid layouts adapt to screen size
- **Loading states**: Skeleton loaders and spinners
- **Success/Error feedback**: Color-coded messages
- **Confirmation dialogs**: For destructive actions (delete)
- **Icon indicators**: Visual cues for actions and status

### Data Flow
```
User Action
  → Component Event Handler
    → API Call (with auth token)
      → Backend Processing
        → Response
          → State Update
            → UI Re-render
```

### Performance Optimizations
- Efficient filtering with query parameters
- Conditional rendering based on activeView
- Minimal re-renders with proper state management
- Lazy loading of dropdown data

---

## Testing Checklist

### Godown Management
- [ ] Create warehouse
- [ ] Edit warehouse
- [ ] Delete warehouse
- [ ] Toggle active status
- [ ] View all warehouses

### Stock Balance
- [ ] View all balances
- [ ] Filter by warehouse
- [ ] Filter by product
- [ ] View detailed breakdown
- [ ] Verify quantity accuracy

### Stock Movements
- [ ] View all movements
- [ ] Filter by product
- [ ] Filter by warehouse
- [ ] Filter by date range
- [ ] Verify IN/OUT indicators
- [ ] Check summary stats

### Stock Transfer
- [ ] Transfer between warehouses
- [ ] Validation: same warehouse error
- [ ] Validation: quantity > 0
- [ ] Preview display accuracy
- [ ] Success confirmation

### Stock Items
- [ ] Create stock item
- [ ] Edit stock item
- [ ] Delete stock item
- [ ] Filter by warehouse
- [ ] Filter by product
- [ ] Filter by status

---

## API Documentation Reference
Full API documentation can be found in:
- `/API_DOCUMENTATION.md` - Complete backend API reference
- Section: **Inventory APIs** (lines 529-750)

---

## Future Enhancements (Potential)
1. **Stock Reservations**: Implement reservation system for orders
2. **Batch Transfers**: Transfer multiple products at once
3. **Stock Alerts**: Low stock notifications
4. **Audit Trail**: Complete history of changes
5. **Export/Import**: CSV/Excel export for reports
6. **Stock Valuation**: Calculate total stock value
7. **Reorder Points**: Set minimum stock levels
8. **Barcode Scanning**: Mobile-friendly stock management

---

## Support & Maintenance
- All components follow TypeScript strict mode
- ESLint compliant code
- Consistent error handling patterns
- Reusable authentication utilities
- Modular component structure for easy updates

---

**Last Updated**: January 6, 2026  
**Version**: 2.0  
**Contributors**: AI Assistant
