# User Flow Diagrams

## Manufacturer Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      MANUFACTURER FLOW                           │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  Signup  │
    │   Page   │
    └────┬─────┘
         │
         ▼
    ┌──────────┐
    │  Login   │
    │   Form   │
    └────┬─────┘
         │
         ▼
    ┌─────────────────┐
    │ Check Company?  │
    └────┬────────┬───┘
         │        │
    Yes  │        │ No
         │        │
         ▼        ▼
    ┌─────────┐  ┌──────────────┐
    │Dashboard│  │Company Create│
    │         │  │   Page       │
    └─────────┘  └──────┬───────┘
                        │
                        │ (Auto-redirect
                        │  after 1.2s)
                        ▼
                   ┌─────────┐
                   │Dashboard│
                   └─────────┘
```

---

## Retailer Complete Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             RETAILER FLOW                                        │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │  Signup  │
    │   Page   │
    └────┬─────┘
         │
         ▼
    ┌──────────────┐
    │Profile Setup │
    │    Page      │
    └────┬─────────┘
         │
    ┌────┴────┐
    │ Fill or │
    │  Skip   │
    └────┬────┘
         │
         ▼
    ┌──────────────────────────────────────┐
    │   Company Connection Page            │
    │                                      │
    │  ┌────────┐ ┌────────┐ ┌─────────┐ │
    │  │Discover│ │My Conn │ │Invite   │ │
    │  │        │ │        │ │Code     │ │
    │  └────┬───┘ └───┬────┘ └────┬────┘ │
    │       │         │           │      │
    └───────┼─────────┼───────────┼──────┘
            │         │           │
            └─────────┴───────────┘
                      │
            ┌─────────▼──────────┐
            │ Connection Status: │
            ├────────────────────┤
            │ Pending - Wait     │
            │ Approved - Order!  │◄─────────┐
            │ Rejected - No      │          │
            └─────────┬──────────┘          │
                      │                     │
            ┌─────────▼──────────┐          │
            │  [Place Order]     │          │
            │     Button         │          │
            └─────────┬──────────┘          │
                      │                     │
                      ▼                     │
            ┌────────────────────┐          │
            │  Order Placement   │          │
            │      Page          │          │
            │                    │          │
            │ 1. Select Products │          │
            │ 2. Add Quantities  │          │
            │ 3. Review Cart     │          │
            │ 4. Submit Order    │          │
            └─────────┬──────────┘          │
                      │                     │
                      ▼                     │
            ┌────────────────────┐          │
            │  Success Screen    │          │
            ├────────────────────┤          │
            │ • Generate Invoice │──┐       │
            │ • Do This Later    │  │       │
            └─────────┬──────────┘  │       │
                      │             │       │
                      │ (Later)     │       │
                      ▼             ▼       │
            ┌────────────┐   ┌────────────────┐
            │ Dashboard  │   │Invoice Generate│
            └────────────┘   │     Page       │
                             │                │
                             │1. Billing Addr │
                             │2. Shipping Addr│
                             │3. Apply GST    │
                             │4. Generate     │
                             └────────┬───────┘
                                      │
                                      ▼
                             ┌────────────────┐
                             │Invoice Success │
                             ├────────────────┤
                             │ • View Invoice │
                             │ • Dashboard    │
                             └────────────────┘
```

---

## Retailer Company Connection - Detailed

```
┌───────────────────────────────────────────────────────────────┐
│            COMPANY CONNECTION PAGE (3 TABS)                   │
└───────────────────────────────────────────────────────────────┘

TAB 1: Discover Companies
┌─────────────────────────────────┐
│  Public Company Listing         │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🏢 Company A            │   │
│  │ Location: City, State   │   │
│  │ Description...          │   │
│  │ [Request to Connect]    │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🏢 Company B            │   │
│  │ Location: City, State   │   │
│  │ Description...          │   │
│  │ [Request to Connect]    │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
         │
         │ Click Request
         ▼
    [POST /retailer/request-approval/]
         │
         ▼
    Status: PENDING


TAB 2: My Connections
┌─────────────────────────────────────────┐
│  Connected Companies List               │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ 🏢 Company X                     │  │
│  │ 🟡 PENDING                       │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ 🏢 Company Y                     │  │
│  │ 🟢 APPROVED    [Place Order] ◄─────┼─ Click to Order
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ 🏢 Company Z                     │  │
│  │ 🔴 REJECTED                      │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘


TAB 3: Join by Code
┌─────────────────────────────┐
│  Join by Invite Code        │
│                             │
│  Invite Code:               │
│  ┌─────────────────────┐   │
│  │ ABC123XYZ789        │   │
│  └─────────────────────┘   │
│                             │
│  [Join Company]             │
└─────────────────────────────┘
         │
         │ Click Join
         ▼
    [POST /retailer/join-by-code/]
         │
         ▼
    Status: APPROVED (instant)
```

---

## Order Placement Flow - Step by Step

```
┌─────────────────────────────────────────────────────────────┐
│                   ORDER PLACEMENT PAGE                       │
└─────────────────────────────────────────────────────────────┘

STEP 1: Product Selection
┌────────────────────────┐     ┌──────────────────┐
│  Add Products          │     │  Order Summary   │
│                        │     │                  │
│  Product:              │     │  (Empty)         │
│  [Select Product ▼]    │     │                  │
│                        │     │  No items yet    │
│  Quantity:             │     │                  │
│  [  10  ]              │     │                  │
│                        │     │                  │
│  [+ Add to Order]      │     │                  │
└────────────────────────┘     └──────────────────┘

STEP 2: Adding Items
┌────────────────────────┐     ┌──────────────────┐
│  Add Products          │     │  Order Summary   │
│                        │     │                  │
│  Product:              │     │  📦 Product A    │
│  [Select Product ▼]    │     │  10 x $50.00     │
│                        │     │  [🗑️]            │
│  Quantity:             │     │                  │
│  [  5   ]              │     │  📦 Product B    │
│                        │     │  5 x $30.00      │
│  [+ Add to Order]      │     │  [🗑️]            │
└────────────────────────┘     │                  │
                               │  Total: $650.00  │
                               │                  │
                               │  [Submit Order]  │
                               └──────────────────┘

STEP 3: Submit Order
         │
         ▼
    [POST /api/orders/sales/]
         │
         ▼
    [Add each item via POST /api/orders/sales/{id}/add_item/]
         │
         ▼
┌─────────────────────────────┐
│   ✅ ORDER SUBMITTED!       │
│                             │
│  Your order is pending      │
│  approval                   │
│                             │
│  [Generate Invoice]         │
│  [Do This Later]            │
└─────────────────────────────┘
```

---

## Invoice Generation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                INVOICE GENERATION PAGE                       │
└─────────────────────────────────────────────────────────────┘

FORM INPUT:
┌────────────────────────────────────┐
│  📄 Invoice Details                │
│                                    │
│  Billing Address: *                │
│  ┌──────────────────────────────┐ │
│  │ 123 Main St                  │ │
│  │ Suite 100                    │ │
│  │ New York, NY 10001           │ │
│  └──────────────────────────────┘ │
│                                    │
│  Shipping Address: *               │
│  ┌──────────────────────────────┐ │
│  │ Same as billing              │ │
│  └──────────────────────────────┘ │
│                                    │
│  Notes: (Optional)                 │
│  ┌──────────────────────────────┐ │
│  │ Please deliver by Friday     │ │
│  └──────────────────────────────┘ │
│                                    │
│  ☑ Apply GST to invoice            │
│                                    │
│  [Generate Invoice] [Do Later]    │
└────────────────────────────────────┘
         │
         │ Click Generate
         ▼
[POST /api/invoices/from_sales_order/{order_id}/]
         │
         ▼
┌────────────────────────────────────┐
│   ✅ INVOICE GENERATED!            │
│                                    │
│  Invoice #: INV-2025-0001          │
│  Total: INR 15,000.00              │
│  Status: POSTED                    │
│                                    │
│  [📥 View Invoice]                 │
│  [Go to Dashboard]                 │
└────────────────────────────────────┘
```

---

## Status Flow Diagram

```
┌────────────────────────────────────────────────────────────┐
│              CONNECTION STATUS PROGRESSION                  │
└────────────────────────────────────────────────────────────┘

SCENARIO 1: Request Approval
    Request
    Sent        Approved       Can Place
      ↓            ↓            Orders
    🟡 ────────→ 🟢 ─────────→ [Place Order]
   PENDING      APPROVED         Button
      │
      │ (If rejected)
      ↓
    🔴
  REJECTED


SCENARIO 2: Join by Invite Code
    Enter
    Code         Instant
      ↓          Approval
    [Code] ────→ 🟢 ─────────→ [Place Order]
                APPROVED         Button


SCENARIO 3: Connection Suspended
    Active        Admin         Disabled
      ↓          Suspends
    🟢 ────────→ ⚪ ─────────→ (No actions)
  APPROVED     SUSPENDED
```

---

## Complete User Journey Map

```
┌────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE END-TO-END FLOW                             │
└────────────────────────────────────────────────────────────────────────┘

MANUFACTURER:
START → Signup → Login → Company? → Create → Dashboard → Manage Business
                            ↓
                          (Has)
                            ↓
                        Dashboard

RETAILER:
START → Signup → Profile → Companies → Connection → Order → Invoice → Dashboard
         ↓         ↓          ↓           ↓          ↓        ↓
       (New)   (Fill/Skip) (3 ways)  (Approved)  (Items)  (Later)
                                                                ↓
                                                              [END]

KEY DECISION POINTS:
• Profile: Fill or Skip
• Companies: Discover, Invite, or My Connections
• Connection: Wait for approval or instant (code)
• Order: Generate invoice or Later
• Invoice: View or Dashboard
```

---

## Navigation Structure

```
┌──────────────────────────────────────────────────────┐
│               RETAILER PORTAL STRUCTURE               │
└──────────────────────────────────────────────────────┘

/retailer
   │
   ├── /setup                    (Profile Setup)
   │
   ├── /companies                (Company Connections)
   │     ├── Tab: Discover
   │     ├── Tab: My Connections
   │     └── Tab: Join by Code
   │
   ├── /orders
   │     └── /new                (Place Order)
   │           └── ?company={id}
   │
   └── /invoices
         └── /generate           (Generate Invoice)
               └── ?order={id}


┌──────────────────────────────────────────────────────┐
│            MANUFACTURER PORTAL STRUCTURE              │
└──────────────────────────────────────────────────────┘

/manufacturer
   │
   ├── /company                  (Company Management)
   │     └── ?first=true         (First-time creation)
   │
   └── (Dashboard)
```

---

## Error Handling Flow

```
┌──────────────────────────────────────────────────────┐
│                  ERROR SCENARIOS                      │
└──────────────────────────────────────────────────────┘

API Error → Display Error Message
   │         (Red banner)
   ├── 401 Unauthorized → Redirect to Login
   ├── 404 Not Found → Show "Not found" message
   ├── 400 Bad Request → Show validation errors
   └── 500 Server Error → Show "Server error" message

Validation Error → Inline Field Error
   │
   ├── Required field empty → "This field is required"
   ├── Invalid email → "Please enter valid email"
   ├── Invalid quantity → "Quantity must be positive"
   └── Insufficient stock → "Only X units available"

Network Error → Retry Option
   │
   └── Show "Server unreachable. Please try again."
```

---

## Success Feedback Flow

```
┌──────────────────────────────────────────────────────┐
│                SUCCESS INDICATORS                     │
└──────────────────────────────────────────────────────┘

Profile Saved → Green Banner + Redirect
Company Created → Green Banner + Auto-redirect (1.2s)
Connection Request → Green Banner + Tab Switch
Order Placed → Success Screen + Options
Invoice Generated → Success Screen + Actions

Each Success Screen Shows:
  ✅ Success Icon
  📋 Details
  🔘 Next Actions
```

This visual documentation provides clear understanding of all user flows! 🎉
