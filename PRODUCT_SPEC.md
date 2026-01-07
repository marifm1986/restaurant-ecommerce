# Restaurant Food Supplier SaaS Platform
## Product Specification Document

**Version:** 1.0
**Project:** Meat N Beans Co.
**Stack:** Next.js (App Router) + Firebase Auth + Firestore
**Firebase Plan:** Spark (Free Tier)
**Architecture:** Mobile-first, Multi-tenant SaaS

---

## 1. Overview

### Executive Summary

A mobile-first SaaS ecommerce platform enabling restaurant food suppliers to manage their B2B sales operations. The platform supports guest checkout for one-time purchases, registered buyers with full ledger tracking, manual payment workflows, and subscription-based access control.

### Target Users

- **Restaurant food suppliers** seeking to digitize their order management and buyer relationships
- **Restaurant buyers** placing recurring orders with ledger-based payment tracking
- **Guest purchasers** making one-time orders without account creation

### Core Value Proposition

1. **Unified Order Management:** Single platform for guest and registered buyer orders
2. **Ledger-Based Payments:** Track purchases, manual payments, and dues per buyer
3. **Subscription Access Control:** Monetize platform access with subscription management
4. **Multi-Tenant Administration:** Company-level isolation with global oversight capability

---

## 2. User Roles & Permissions

### Role Matrix

| Role | Scope | Authentication | Subscription Required | Data Access |
|------|-------|----------------|----------------------|-------------|
| **Guest** | Public storefront | None | No | Read: public products only |
| **Registered Buyer** | Company-specific | Firebase Auth | Yes (active) | Read/Write: own orders, ledger |
| **Owner Admin** | Company-level | Firebase Auth + Owner claim | Yes (active) | Full company data access |
| **Super Master User** | Global | Firebase Auth + SuperMaster claim | N/A | All companies, all data |

### Detailed Capabilities

| Capability | Guest | Registered Buyer | Owner Admin | Super Master |
|------------|-------|------------------|-------------|--------------|
| Browse product catalog | ✓ | ✓ | ✓ | ✓ |
| Add to cart | ✓ | ✓ | ✓ | ✓ |
| Guest checkout | ✓ | — | — | — |
| Place order (ledger entry) | — | ✓ | ✓ | ✓ |
| View own ledger | — | ✓ | — | — |
| View all buyer ledgers | — | — | ✓ | ✓ |
| Record manual payments | — | — | ✓ | ✓ |
| Manage products/stock | — | — | ✓ | ✓ |
| Manage employees | — | — | ✓ | ✓ |
| Approve/terminate users | — | — | ✓ (company) | ✓ (global) |
| Manage subscriptions | — | — | — | ✓ |
| View audit logs | — | — | ✓ (company) | ✓ (global) |
| Set global policies | — | — | — | ✓ |

### Role Claim Structure (Firebase Auth Custom Claims)

```typescript
interface UserClaims {
  role: 'guest' | 'buyer' | 'owner' | 'superMaster';
  companyId: string | null; // null for superMaster
  permissions?: string[];   // granular permissions for employees
}
```

---

## 3. Functional Requirements

### 3.1 Storefront & Checkout

#### Product Catalog

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Category filtering | Filter products by category with URL-based state | Must have |
| Stock visibility | Display "In Stock", "Low Stock", "Out of Stock" badges | Must have |
| Unit pricing | Show price per unit (kg, piece, case, etc.) | Must have |
| Bulk pricing | Display tiered pricing for quantity discounts | Should have |
| Product search | Full-text search across name, SKU, category | Must have |
| Image gallery | Product images with zoom capability | Must have |

#### Cart & Checkout

| Flow | Guest | Registered Buyer |
|------|-------|------------------|
| Add to cart | Local storage | Local storage + sync to Firestore |
| Cart persistence | Session-based | Account-based |
| Checkout data | Name, phone, address (form input) | Pre-filled from profile |
| Payment method | "Manual Payment Pending" only | "Manual Payment Pending" only |
| Order creation | Creates order without userId | Creates order with userId + ledger entry |
| Ledger entry | None | Purchase entry added automatically |

#### Order Confirmation

- Generate unique `orderId` (format: `ORD-{companyId}-{timestamp}-{random4}`)
- Display order summary with line items, totals, and fulfillment timeline
- Send confirmation via email/SMS (future enhancement)
- Store order with status: `pending_payment`

### 3.2 Buyer Ledger & Manual Payments

#### Ledger Structure

Each registered buyer maintains a running ledger with the following entry types:

| Entry Type | Trigger | Effect on Balance |
|------------|---------|-------------------|
| `purchase` | Order placed | Increases dues |
| `payment` | Owner records payment | Decreases dues |
| `adjustment` | Manual correction | Increases or decreases |
| `refund` | Return processed | Decreases dues |

#### Manual Payment Flow

```
1. Buyer pays offline (cash, bank transfer, check)
2. Buyer notifies owner of payment
3. Owner navigates to Payments > Record Payment
4. Owner enters: amount, method, reference number, date received
5. System creates payment record with status: "recorded"
6. System updates ledger with payment entry
7. System recalculates buyer's running balance
8. Buyer sees updated balance on dashboard
```

#### Ledger Integrity Rules

- All ledger modifications are append-only (no direct balance edits)
- Running balance is calculated from entries, not stored separately (except as cache)
- Each entry includes `createdBy`, `createdAt`, and reference to source document
- Audit log entry created for every ledger modification

#### Statement Generation

| Feature | Specification |
|---------|---------------|
| Format | PDF and CSV download |
| Filters | Date range, entry type |
| Content | All entries with running balance, summary totals |
| Access | Buyer: own statements; Owner: all buyers |

### 3.3 Subscription & Access Control

#### Subscription Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Registration│ -> │   Pending   │ -> │   Active    │ -> │   Expired   │
│             │    │  Approval   │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                         │                   │                  │
                         v                   v                  v
                   Owner approves      Access granted      Login blocked
                   after payment       until expiry        renewal prompt
```

#### Subscription States

| State | Login Allowed | Data Access | Transition Trigger |
|-------|---------------|-------------|-------------------|
| `pending` | No | None | User registers |
| `active` | Yes | Full (per role) | Owner approves |
| `expired` | No | Read-only (own data) | Current date > expiryDate |
| `terminated` | No | None | Super Master/Owner action |

#### Expiry Enforcement

**Middleware Layer (Next.js):**
```typescript
// middleware.ts - runs on every protected route
async function subscriptionCheck(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return redirectToLogin();

  const subscription = await getSubscription(session.uid);
  if (subscription.status !== 'active') {
    return redirectToRenewal();
  }
  if (new Date(subscription.expiryDate) < new Date()) {
    await updateSubscriptionStatus(session.uid, 'expired');
    return redirectToRenewal();
  }
  return NextResponse.next();
}
```

**Firestore Rules Layer:**
```javascript
// Enforce at data layer as second barrier
match /orders/{orderId} {
  allow read, write: if isSubscriptionActive(request.auth.uid);
}

function isSubscriptionActive(uid) {
  let sub = get(/databases/$(database)/documents/subscriptions/$(uid));
  return sub.data.status == 'active'
    && sub.data.expiryDate > request.time;
}
```

#### Payment Gateway Abstraction

```typescript
// services/payment/PaymentService.ts
interface PaymentService {
  createSubscription(userId: string, plan: SubscriptionPlan): Promise<SubscriptionResult>;
  verifyPayment(paymentId: string): Promise<PaymentVerification>;
  refund(paymentId: string, amount: number): Promise<RefundResult>;
  handleWebhook(payload: unknown): Promise<WebhookResult>;
}

// Current implementation
class ManualPaymentService implements PaymentService {
  async createSubscription(userId: string, plan: SubscriptionPlan) {
    // Creates subscription with status: 'pending'
    // No external payment processing
  }
  // ... other methods return not-implemented or manual-flow responses
}

// Future implementation (disabled via feature flag)
class StripePaymentService implements PaymentService {
  // Full Stripe integration
}
```

**Feature Flag:**
```typescript
// config/features.ts
export const FEATURES = {
  PAYMENT_GATEWAY_ENABLED: false, // Toggle when ready
  PAYMENT_PROVIDER: 'manual' as 'manual' | 'stripe' | 'razorpay',
};
```

### 3.4 Owner Admin Panel

#### Product Management

| Operation | Fields | Validation |
|-----------|--------|------------|
| Create product | name, sku, category, price, bulkPricing[], stockQty, unit, imageUrl | SKU unique per company |
| Update product | All fields editable | Stock changes via Stock module |
| Deactivate product | isActive: false | Soft delete, preserves history |
| Delete product | Hard delete | Only if zero orders reference it |

#### Stock & Damage Management

| Movement Type | Trigger | Required Fields |
|---------------|---------|-----------------|
| `stock_in` | Purchase received | qty, referenceId (purchaseId), notes |
| `stock_out` | Order fulfilled | qty, referenceId (orderId) |
| `damage` | Damage logged | qty, reason (dropdown + notes), imageUrl |
| `adjustment` | Manual correction | qty (+/-), reason, approvedBy |

**Reason Codes for Damage:**
- `expired` - Product past expiry date
- `spoiled` - Quality degradation
- `broken` - Physical damage
- `lost` - Inventory discrepancy
- `other` - Free text required

#### Purchase Entry (Supplier Purchases)

| Field | Type | Required |
|-------|------|----------|
| supplierId | reference | Yes |
| items[] | array | Yes |
| items[].productId | reference | Yes |
| items[].qty | number | Yes |
| items[].costPerUnit | number | Yes |
| items[].batchNumber | string | No |
| items[].expiryDate | timestamp | No |
| totalCost | number (calculated) | Yes |
| invoiceNumber | string | No |
| receivedAt | timestamp | Yes |
| receivedBy | reference (userId) | Yes |

#### Employee Management

| Field | Description |
|-------|-------------|
| userId | Reference to users collection |
| role | `picker`, `packer`, `accountant`, `manager` |
| permissions[] | Granular access: `view_orders`, `fulfill_orders`, `view_ledgers`, `record_payments`, etc. |
| status | `active`, `suspended`, `terminated` |
| activityLog | Recent actions with timestamps |

#### User Approvals Workflow

```
1. Owner navigates to Users > Pending Approvals
2. Views list of users with status: 'pending'
3. For each user:
   a. View payment confirmation (screenshot/reference)
   b. Verify payment received
   c. Action: Approve → set status 'active', set expiryDate
   d. Action: Deny → set status 'rejected', send notification
4. Approved users can now log in
```

### 3.5 Super Master Controls

#### Global Dashboard

| Metric | Description |
|--------|-------------|
| Total companies | Count of active companies |
| Total users | Breakdown by role |
| Pending approvals | Users awaiting subscription approval |
| Expiring soon | Subscriptions expiring in 7 days |
| System health | Cloud Function status, error rates |

#### User Termination Process

**Immediate Actions (Synchronous):**
1. Set user status to `terminated` in Firestore
2. Set subscription status to `terminated`
3. Revoke Firebase Auth refresh tokens
4. Clear active sessions (if session store exists)

**Firestore Rules Enforcement:**
```javascript
match /{document=**} {
  allow read, write: if !isTerminated(request.auth.uid);
}

function isTerminated(uid) {
  let user = get(/databases/$(database)/documents/users/$(uid));
  return user.data.status == 'terminated';
}
```

**Audit Log Entry:**
```typescript
{
  actorId: superMasterUserId,
  action: 'user_terminated',
  entityType: 'user',
  entityId: terminatedUserId,
  metadata: {
    reason: string,
    previousStatus: string,
    companyId: string
  },
  timestamp: serverTimestamp()
}
```

#### Policy Enforcement

| Policy | Scope | Configuration |
|--------|-------|---------------|
| Rate limits | Per company | Max orders/day, max API calls/minute |
| Storage quotas | Per company | Max product images, max document size |
| Subscription plans | Global | Plan names, pricing, duration, features |

---

## 4. Data Model

### Firestore Collections Schema

#### `companies`

```typescript
interface Company {
  id: string;                    // Auto-generated
  name: string;
  status: 'active' | 'suspended' | 'terminated';
  subscriptionPlan: string;      // Reference to plan
  subscriptionExpiry: Timestamp;
  ownerId: string;               // Reference to users
  settings: {
    currency: string;
    timezone: string;
    orderPrefix: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `users`

```typescript
interface User {
  id: string;                    // Same as Firebase Auth UID
  companyId: string | null;      // null for superMaster
  email: string;
  phone: string;
  name: string;
  role: 'guest' | 'buyer' | 'owner' | 'superMaster';
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  subscriptionExpiry: Timestamp | null;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `products`

```typescript
interface Product {
  id: string;
  companyId: string;             // REQUIRED for multi-tenancy
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  bulkPricing: {
    minQty: number;
    price: number;
  }[];
  stockQty: number;
  unit: 'kg' | 'piece' | 'case' | 'liter' | 'dozen';
  imageUrls: string[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `orders`

```typescript
interface Order {
  id: string;
  orderId: string;               // Human-readable ID
  companyId: string;             // REQUIRED for multi-tenancy
  userId: string | null;         // null for guest orders
  guestInfo?: {                  // Only for guest orders
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  items: {
    productId: string;
    productName: string;         // Denormalized
    qty: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending_payment' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid';
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `ledgers`

```typescript
interface Ledger {
  id: string;                    // Same as userId
  companyId: string;             // REQUIRED for multi-tenancy
  userId: string;
  entries: LedgerEntry[];        // Subcollection recommended for large ledgers
  currentBalance: number;        // Cached, recalculated on each entry
  lastEntryAt: Timestamp;
  updatedAt: Timestamp;
}

interface LedgerEntry {
  id: string;
  type: 'purchase' | 'payment' | 'adjustment' | 'refund';
  amount: number;                // Positive for dues, negative for payments
  referenceType: 'order' | 'payment' | 'manual';
  referenceId: string;
  description: string;
  balanceAfter: number;          // Running balance after this entry
  createdBy: string;
  createdAt: Timestamp;
}
```

#### `payments`

```typescript
interface Payment {
  id: string;
  companyId: string;             // REQUIRED for multi-tenancy
  userId: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'check' | 'upi' | 'other';
  reference: string;             // Check number, transaction ID, etc.
  notes: string;
  receivedBy: string;            // Owner/admin userId
  receivedAt: Timestamp;
  status: 'recorded' | 'verified' | 'disputed';
  createdAt: Timestamp;
}
```

#### `stockMovements`

```typescript
interface StockMovement {
  id: string;
  companyId: string;             // REQUIRED for multi-tenancy
  productId: string;
  type: 'stock_in' | 'stock_out' | 'damage' | 'adjustment';
  qty: number;                   // Positive for in, negative for out
  reason: string;
  reasonCode?: 'expired' | 'spoiled' | 'broken' | 'lost' | 'other';
  referenceType?: 'purchase' | 'order' | 'manual';
  referenceId?: string;
  previousQty: number;
  newQty: number;
  createdBy: string;
  createdAt: Timestamp;
}
```

#### `employees`

```typescript
interface Employee {
  id: string;
  companyId: string;             // REQUIRED for multi-tenancy
  userId: string;
  role: 'picker' | 'packer' | 'accountant' | 'manager';
  permissions: string[];
  status: 'active' | 'suspended' | 'terminated';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `subscriptions`

```typescript
interface Subscription {
  id: string;                    // Same as userId
  companyId: string;
  userId: string;
  plan: string;
  status: 'pending' | 'active' | 'expired' | 'terminated';
  startDate: Timestamp | null;
  expiryDate: Timestamp | null;
  paymentReference?: string;     // For future gateway integration
  externalPaymentId?: string;    // Stripe/Razorpay ID for reconciliation
  approvedBy: string | null;
  approvedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `auditLogs`

```typescript
interface AuditLog {
  id: string;
  actorId: string;
  companyId: string | null;      // null for global actions
  action: string;                // e.g., 'user_created', 'payment_recorded', 'product_updated'
  entityType: string;            // e.g., 'user', 'order', 'product'
  entityId: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp;
}
```

### Indexing Strategy

| Collection | Composite Index | Purpose |
|------------|-----------------|---------|
| `products` | `companyId` + `isActive` + `category` | Filtered product listing |
| `orders` | `companyId` + `userId` + `createdAt` (desc) | User order history |
| `orders` | `companyId` + `status` + `createdAt` (desc) | Order management |
| `ledgers` | `companyId` + `userId` | Buyer ledger lookup |
| `subscriptions` | `status` + `expiryDate` | Expiry checks |
| `subscriptions` | `companyId` + `status` | Company subscription list |
| `stockMovements` | `companyId` + `productId` + `createdAt` (desc) | Stock history |
| `auditLogs` | `companyId` + `timestamp` (desc) | Audit trail |
| `auditLogs` | `actorId` + `timestamp` (desc) | User activity |

---

## 5. Security & Access Control

### Authentication Flow

```
1. User signs up with email/password or phone
2. Firebase Auth creates user record
3. Cloud Function triggers on user creation:
   a. Creates user document in Firestore
   b. Creates subscription document with status: 'pending'
   c. Sets default custom claims: { role: 'buyer', companyId: null }
4. User selects company (or creates new as owner)
5. Owner approves user → Cloud Function:
   a. Updates subscription status to 'active'
   b. Sets expiryDate
   c. Updates custom claims with companyId
6. User can now access protected routes
```

### Custom Claims Management (via Next.js API Routes)

Since Cloud Functions are not available on Spark plan, custom claims are set via Next.js API routes using Firebase Admin SDK:

```typescript
// app/api/admin/set-user-claims/route.ts
import { adminAuth } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/firebase/auth-utils';

export async function POST(req: Request) {
  // Verify caller from Authorization header
  const token = req.headers.get('authorization')?.split('Bearer ')[1];
  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const callerClaims = await verifyAuthToken(token);
  if (!callerClaims || !['owner', 'superMaster'].includes(callerClaims.role)) {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { userId, role, companyId, permissions } = await req.json();

  // Owner can only set claims for their company
  if (callerClaims.role === 'owner' && companyId !== callerClaims.companyId) {
    return Response.json({ error: 'Cannot modify users outside your company' }, { status: 403 });
  }

  await adminAuth.setCustomUserClaims(userId, {
    role,
    companyId,
    permissions: permissions || []
  });

  // Force token refresh
  await adminAuth.revokeRefreshTokens(userId);

  return Response.json({ success: true });
}
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isActive() {
      let user = getUserData();
      return user.status == 'active';
    }

    function hasRole(role) {
      return request.auth.token.role == role;
    }

    function isCompanyMember(companyId) {
      return request.auth.token.companyId == companyId;
    }

    function isSuperMaster() {
      return hasRole('superMaster');
    }

    function isOwner() {
      return hasRole('owner');
    }

    function isSubscriptionActive() {
      let sub = get(/databases/$(database)/documents/subscriptions/$(request.auth.uid)).data;
      return sub.status == 'active' && sub.expiryDate > request.time;
    }

    function isTerminated() {
      let user = getUserData();
      return user.status == 'terminated';
    }

    // Block all access for terminated users
    match /{document=**} {
      allow read, write: if isAuthenticated() && !isTerminated();
    }

    // Products - public read, company-scoped write
    match /products/{productId} {
      allow read: if true; // Public catalog
      allow create, update: if isAuthenticated()
        && isSubscriptionActive()
        && (isSuperMaster() || (isOwner() && isCompanyMember(resource.data.companyId)));
      allow delete: if isSuperMaster()
        || (isOwner() && isCompanyMember(resource.data.companyId));
    }

    // Orders - company-scoped
    match /orders/{orderId} {
      allow read: if isSuperMaster()
        || isCompanyMember(resource.data.companyId)
        || (resource.data.userId == request.auth.uid);
      allow create: if true; // Allow guest orders
      allow update: if isAuthenticated()
        && isSubscriptionActive()
        && (isSuperMaster() || isCompanyMember(resource.data.companyId));
    }

    // Ledgers - company-scoped, buyer can read own
    match /ledgers/{ledgerId} {
      allow read: if isSuperMaster()
        || (isOwner() && isCompanyMember(resource.data.companyId))
        || resource.data.userId == request.auth.uid;
      allow write: if isAuthenticated()
        && isSubscriptionActive()
        && (isSuperMaster() || (isOwner() && isCompanyMember(resource.data.companyId)));
    }

    // Payments - company-scoped, owner/superMaster only
    match /payments/{paymentId} {
      allow read: if isSuperMaster()
        || (isOwner() && isCompanyMember(resource.data.companyId))
        || resource.data.userId == request.auth.uid;
      allow write: if isAuthenticated()
        && isSubscriptionActive()
        && (isSuperMaster() || (isOwner() && isCompanyMember(resource.data.companyId)));
    }

    // Subscriptions - superMaster full access, users read own
    match /subscriptions/{subId} {
      allow read: if isSuperMaster() || request.auth.uid == subId;
      allow write: if isSuperMaster()
        || (isOwner() && isCompanyMember(resource.data.companyId));
    }

    // Users - company-scoped read, limited write
    match /users/{userId} {
      allow read: if isSuperMaster()
        || request.auth.uid == userId
        || (isOwner() && isCompanyMember(resource.data.companyId));
      allow update: if isSuperMaster()
        || request.auth.uid == userId
        || (isOwner() && isCompanyMember(resource.data.companyId));
      allow create: if isAuthenticated();
    }

    // Audit logs - read only for authorized users
    match /auditLogs/{logId} {
      allow read: if isSuperMaster()
        || (isOwner() && isCompanyMember(resource.data.companyId));
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

### Termination Workflow (via Next.js API Route)

```typescript
// app/api/admin/terminate-user/route.ts
import { adminAuth, adminDb, FieldValue } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/firebase/auth-utils';

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.split('Bearer ')[1];
  if (!token) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const callerClaims = await verifyAuthToken(token);
  if (!callerClaims) {
    return Response.json({ error: 'Must be logged in' }, { status: 401 });
  }

  const { targetUserId, reason } = await req.json();

  const targetUser = await adminDb.doc(`users/${targetUserId}`).get();
  const targetData = targetUser.data();

  // Permission check
  if (callerClaims.role === 'owner') {
    if (targetData?.companyId !== callerClaims.companyId) {
      return Response.json({ error: 'Cannot terminate users outside your company' }, { status: 403 });
    }
    if (targetData?.role === 'owner') {
      return Response.json({ error: 'Owners cannot terminate other owners' }, { status: 403 });
    }
  } else if (callerClaims.role !== 'superMaster') {
    return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const batch = adminDb.batch();

  // 1. Update user status
  batch.update(adminDb.doc(`users/${targetUserId}`), {
    status: 'terminated',
    updatedAt: FieldValue.serverTimestamp()
  });

  // 2. Update subscription status
  batch.update(adminDb.doc(`subscriptions/${targetUserId}`), {
    status: 'terminated',
    updatedAt: FieldValue.serverTimestamp()
  });

  // 3. Create audit log
  batch.create(adminDb.collection('auditLogs').doc(), {
    actorId: callerClaims.uid,
    companyId: targetData?.companyId,
    action: 'user_terminated',
    entityType: 'user',
    entityId: targetUserId,
    metadata: { reason, previousStatus: targetData?.status },
    timestamp: FieldValue.serverTimestamp()
  });

  await batch.commit();

  // 4. Revoke refresh tokens (synchronous)
  await adminAuth.revokeRefreshTokens(targetUserId);

  // 5. Clear custom claims
  await adminAuth.setCustomUserClaims(targetUserId, {
    role: 'terminated',
    companyId: null
  });

  return Response.json({ success: true });
}
```

---

## 6. Architecture & Performance

### Technical Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14+ (App Router) | Server/client components, routing |
| Styling | Tailwind CSS | Mobile-first responsive design |
| State | React Query / SWR | Server state management, caching |
| Auth | Firebase Auth | Authentication, session management |
| Database | Firestore | NoSQL document storage |
| Server Logic | Next.js API Routes | Replace Cloud Functions (Spark plan limitation) |
| Storage | Firebase Storage (5GB limit) | Product images, documents |
| Hosting | Vercel | Edge deployment (preferred over Firebase Hosting) |
| Cron | Vercel Cron / cron-job.org | Scheduled tasks (no Cloud Functions) |

### Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (public)/                 # Public routes (no auth)
│   │   ├── page.tsx              # Landing page
│   │   ├── products/             # Product catalog
│   │   └── cart/                 # Cart & checkout
│   ├── (auth)/                   # Auth routes
│   │   ├── login/
│   │   ├── register/
│   │   └── renewal/              # Subscription renewal
│   ├── (protected)/              # Authenticated routes
│   │   ├── dashboard/            # Buyer dashboard
│   │   ├── orders/
│   │   └── ledger/
│   ├── admin/                    # Owner admin panel
│   │   ├── products/
│   │   ├── stock/
│   │   ├── purchases/
│   │   ├── employees/
│   │   ├── users/
│   │   └── payments/
│   └── super/                    # Super master panel
│       ├── companies/
│       ├── users/
│       └── subscriptions/
├── components/
│   ├── ui/                       # Base UI components
│   ├── forms/                    # Form components
│   └── layouts/                  # Layout components
├── services/                     # Business logic
│   ├── auth/
│   ├── products/
│   ├── orders/
│   ├── ledger/
│   ├── payments/
│   ├── subscription/
│   └── stock/
├── lib/
│   ├── firebase/                 # Firebase config & helpers
│   ├── hooks/                    # Custom React hooks
│   └── utils/                    # Utility functions
├── types/                        # TypeScript types
└── middleware.ts                 # Auth & subscription checks
```

### Caching Strategy

| Data Type | Strategy | TTL | Invalidation |
|-----------|----------|-----|--------------|
| Product catalog | ISR | 60 seconds | On product update (revalidate) |
| Product images | CDN | 1 year | Versioned URLs |
| User session | Memory + cookie | 1 hour | On logout/termination |
| Ledger data | SWR | 30 seconds | On payment/order |
| Order list | React Query | 60 seconds | On order status change |
| Dashboard stats | SWR | 5 minutes | Manual refresh |

### Data Fetching Patterns

**Server Components (RSC):**
```typescript
// app/(protected)/dashboard/page.tsx
export default async function DashboardPage() {
  const session = await getServerSession();

  // Parallel data fetching
  const [ledger, recentOrders, subscription] = await Promise.all([
    getLedgerSummary(session.uid),
    getRecentOrders(session.uid, 5),
    getSubscription(session.uid)
  ]);

  return <Dashboard ledger={ledger} orders={recentOrders} subscription={subscription} />;
}
```

**Client Components (SWR):**
```typescript
// components/LedgerEntries.tsx
'use client';

export function LedgerEntries({ userId }: { userId: string }) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/ledger/${userId}/entries`,
    fetcher,
    { refreshInterval: 30000 }
  );

  // Optimistic update on payment
  const recordPayment = async (payment: Payment) => {
    await mutate(
      async () => {
        await createPayment(payment);
        return fetchLedgerEntries(userId);
      },
      { optimisticData: [...data, createOptimisticEntry(payment)] }
    );
  };

  return <EntriesList entries={data} onPayment={recordPayment} />;
}
```

### Firestore Query Optimization

**Avoid N+1 Reads:**
```typescript
// BAD: N+1 reads
const orders = await getOrders(companyId);
for (const order of orders) {
  order.buyer = await getUser(order.userId); // N additional reads
}

// GOOD: Denormalized data
interface Order {
  userId: string;
  buyerName: string;      // Denormalized
  buyerPhone: string;     // Denormalized
  // ... rest of order
}
```

**Pagination with Cursors:**
```typescript
async function getOrdersPaginated(companyId: string, lastDoc?: DocumentSnapshot, limit = 20) {
  let query = db.collection('orders')
    .where('companyId', '==', companyId)
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }

  const snapshot = await query.get();
  return {
    orders: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
    hasMore: snapshot.docs.length === limit
  };
}
```

### Background Jobs (Spark Plan - No Cloud Functions)

Since Cloud Functions are not available on the Spark plan, scheduled tasks use external cron services:

| Job | Implementation | Trigger |
|-----|----------------|---------|
| Subscription expiry check | Next.js API route `/api/cron/check-subscriptions` | Vercel Cron (daily) or cron-job.org |
| Ledger balance recalc | Inline in payment/order API routes | On API call |
| Audit log cleanup | Next.js API route `/api/cron/cleanup-logs` | Vercel Cron (monthly) |
| Stock low alerts | Inline in stock update API routes | On API call |

**Vercel Cron Configuration (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/cron/check-subscriptions",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/cleanup-logs",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

### Error Handling

**Centralized Error Boundary:**
```typescript
// app/error.tsx
'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Log to error reporting service
    logError(error);
  }, [error]);

  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

**Service-Level Error Handling:**
```typescript
// services/orders/createOrder.ts
export async function createOrder(orderData: CreateOrderInput): Promise<Result<Order, OrderError>> {
  try {
    // Validate stock availability
    const stockCheck = await validateStock(orderData.items);
    if (!stockCheck.success) {
      return { success: false, error: { code: 'INSUFFICIENT_STOCK', items: stockCheck.unavailable } };
    }

    // Create order in transaction
    const order = await db.runTransaction(async (tx) => {
      // ... transaction logic
    });

    return { success: true, data: order };
  } catch (error) {
    logError(error);
    return { success: false, error: { code: 'UNKNOWN', message: 'Failed to create order' } };
  }
}
```

---

## 7. UI/UX Requirements

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| Mobile-first | All layouts start at 320px, scale up |
| Touch-friendly | Minimum tap target 44x44px |
| Accessible | WCAG 2.1 AA compliance |
| Fast | LCP < 2.5s, FID < 100ms, CLS < 0.1 |
| Offline-aware | Show clear offline states, queue actions |

### Responsive Breakpoints

```css
/* Tailwind defaults */
sm: 640px   /* Large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
```

### Component Library

Base components using accessible primitives:

- **Button:** Primary, secondary, danger, ghost variants; loading state
- **Input:** Text, number, phone, email with validation states
- **Select:** Native mobile, custom desktop with search
- **Modal:** Focus trap, escape to close, backdrop click
- **Toast:** Success, error, warning, info; auto-dismiss
- **Table:** Responsive (cards on mobile, table on desktop)
- **Card:** Product card, order card, stat card variants

### Page Layouts

#### Storefront (Guest/Buyer)

```
┌─────────────────────────────────────┐
│ Header: Logo | Search | Cart | Auth │
├─────────────────────────────────────┤
│ Category Pills (horizontal scroll)  │
├─────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │ Product │ │ Product │ │ Product │ │
│ │  Card   │ │  Card   │ │  Card   │ │
│ │         │ │         │ │         │ │
│ │ [Add]   │ │ [Add]   │ │ [Add]   │ │
│ └─────────┘ └─────────┘ └─────────┘ │
│        (2-col mobile, 4-col desktop)│
├─────────────────────────────────────┤
│ Floating Cart Button (mobile only)  │
└─────────────────────────────────────┘
```

#### Buyer Dashboard

```
┌─────────────────────────────────────┐
│ Header: Logo | Profile | Logout     │
├─────────────────────────────────────┤
│ Welcome, {name}                     │
│ Subscription: Active until {date}   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Ledger Summary                  │ │
│ │ Total Purchases: ₹X,XXX         │ │
│ │ Total Payments:  ₹X,XXX         │ │
│ │ Current Dues:    ₹X,XXX         │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Recent Orders                       │
│ ┌─────────────────────────────────┐ │
│ │ Order #123 | ₹X,XXX | Pending   │ │
│ │ Order #122 | ₹X,XXX | Delivered │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [View Full Ledger] [Download PDF]   │
└─────────────────────────────────────┘
```

#### Owner Admin Panel

```
┌─────────────────────────────────────────────────────┐
│ Header: Logo | Company | Notifications | Profile    │
├────────────┬────────────────────────────────────────┤
│ Sidebar    │ Content Area                           │
│            │                                        │
│ Dashboard  │ ┌──────────────────────────────────┐   │
│ Products   │ │ Stats Cards (4-grid)             │   │
│ Stock      │ │ Orders | Revenue | Users | Stock │   │
│ Purchases  │ └──────────────────────────────────┘   │
│ Orders     │                                        │
│ Damage     │ ┌──────────────────────────────────┐   │
│ Employees  │ │ Recent Activity / Pending Items  │   │
│ Users      │ │ - Pending approval: 3 users      │   │
│ Payments   │ │ - Low stock: 5 products          │   │
│ Ledgers    │ │ - Pending orders: 12             │   │
│ Reports    │ └──────────────────────────────────┘   │
│            │                                        │
│ (Collapsed │ (Full table/list views per section)   │
│ on mobile) │                                        │
└────────────┴────────────────────────────────────────┘
```

#### Super Master Dashboard

```
┌─────────────────────────────────────────────────────┐
│ Header: Logo | System Status | Super Admin          │
├────────────┬────────────────────────────────────────┤
│ Sidebar    │ Content Area                           │
│            │                                        │
│ Overview   │ ┌──────────────────────────────────┐   │
│ Companies  │ │ Global Stats                     │   │
│ Users      │ │ Companies: X | Users: X | Active │   │
│ Subs       │ └──────────────────────────────────┘   │
│ Policies   │                                        │
│ Logs       │ ┌──────────────────────────────────┐   │
│            │ │ Pending Actions                  │   │
│            │ │ - 5 subscriptions pending        │   │
│            │ │ - 2 companies awaiting setup     │   │
│            │ └──────────────────────────────────┘   │
│            │                                        │
│            │ ┌──────────────────────────────────┐   │
│            │ │ Company List (searchable table)  │   │
│            │ │ [Company] [Status] [Users] [Act] │   │
│            │ └──────────────────────────────────┘   │
└────────────┴────────────────────────────────────────┘
```

### Key Interaction Patterns

| Action | Mobile | Desktop |
|--------|--------|---------|
| Add to cart | Full-width button, quantity modal | Inline quantity, add button |
| Checkout | Multi-step wizard | Single-page form |
| Navigation | Bottom tab bar + hamburger | Persistent sidebar |
| Tables | Card stack with expand | Traditional table with pagination |
| Forms | Full-screen modals | Slide-over panels |
| Filters | Bottom sheet | Sidebar or inline dropdowns |

### Loading & Empty States

- **Skeleton loaders** for content areas (not spinners)
- **Empty states** with illustration + action CTA
- **Error states** with retry button and support link
- **Offline indicator** in header with sync status

---

## 8. Critical User Flows & Acceptance Criteria

### Flow 1: Guest Purchase

**Scenario:** A guest browses products and completes a purchase without an account.

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Guest visits product catalog | Products displayed with stock badges |
| 2 | Guest adds items to cart | Cart updates in local storage, badge shows count |
| 3 | Guest clicks "Checkout" | Checkout form displayed (name, phone, address) |
| 4 | Guest submits order | Order created with `status: pending_payment`, `userId: null` |
| 5 | System confirms | Order ID displayed, "Manual Payment Pending" message |

**Acceptance Criteria:**
- [ ] Order is created with all line items and totals
- [ ] Order has `userId: null` and populated `guestInfo`
- [ ] Order status is `pending_payment`
- [ ] No ledger entry is created
- [ ] Confirmation page shows order ID and fulfillment timeline
- [ ] Guest can view order status via order ID lookup (no auth required)

### Flow 2: Registered Buyer Ledger Update

**Scenario:** A registered buyer places an order, and the owner records a manual payment.

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | Buyer | Places order | Order created, ledger entry added (type: `purchase`) |
| 2 | Buyer | Pays owner offline | — |
| 3 | Owner | Navigates to Payments > Record | Payment form displayed |
| 4 | Owner | Enters amount, method, reference | — |
| 5 | Owner | Submits payment | Payment record created, ledger entry added (type: `payment`) |
| 6 | System | Recalculates balance | `currentBalance` updated on ledger document |
| 7 | Buyer | Views dashboard | Updated balance displayed |

**Acceptance Criteria:**
- [ ] Order creates ledger entry with `type: purchase`, positive amount
- [ ] Payment creates ledger entry with `type: payment`, negative amount
- [ ] Each ledger entry includes `balanceAfter` showing running total
- [ ] `currentBalance` on ledger document matches sum of all entries
- [ ] Buyer dashboard reflects updated dues within 30 seconds (SWR refresh)
- [ ] Audit log records both the order placement and payment recording

### Flow 3: Subscription Approval

**Scenario:** A new user registers, selects a plan, and is approved by the owner after payment.

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | User | Registers with email/password | User created with `status: pending` |
| 2 | User | Selects subscription plan | Subscription created with `status: pending` |
| 3 | User | Pays owner offline | — |
| 4 | Owner | Views Users > Pending | User appears in pending list |
| 5 | Owner | Verifies payment, clicks "Approve" | — |
| 6 | System | Processes approval | User `status: active`, subscription `status: active`, `expiryDate` set |
| 7 | System | Updates custom claims | Role claim set, companyId assigned |
| 8 | User | Logs in | Access granted to protected routes |
| 9 | (Later) | Subscription expires | User blocked with renewal prompt |

**Acceptance Criteria:**
- [ ] Pending users cannot access protected routes (middleware blocks)
- [ ] Owner sees pending users with registration date and selected plan
- [ ] Approval sets `expiryDate` based on plan duration
- [ ] Custom claims updated immediately (token revocation forces refresh)
- [ ] On expiry, middleware redirects to `/renewal` page
- [ ] Expired users can view own historical data (read-only)
- [ ] Renewal follows same approval workflow

### Flow 4: User Termination

**Scenario:** Super Master terminates a user for policy violation.

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | Super Master | Navigates to Users | User list displayed |
| 2 | Super Master | Selects user, clicks "Terminate" | Confirmation modal with reason input |
| 3 | Super Master | Confirms termination | — |
| 4 | System | Executes termination | See below |

**Termination Execution (Synchronous):**
1. User document updated: `status: terminated`
2. Subscription document updated: `status: terminated`
3. Firebase Auth refresh tokens revoked
4. Custom claims cleared: `{ role: 'terminated', companyId: null }`
5. Audit log created with actor, reason, and timestamp

**Acceptance Criteria:**
- [ ] Termination completes within 5 seconds
- [ ] Terminated user's active session is invalidated immediately
- [ ] Terminated user cannot log in (Firebase Auth rejection)
- [ ] Terminated user cannot read any Firestore documents (rules block)
- [ ] Terminated user cannot write any Firestore documents (rules block)
- [ ] Audit log captures termination with full metadata
- [ ] Owner admins can only terminate users within their company
- [ ] Owner admins cannot terminate other owners (Super Master only)

### Flow 5: Admin Product Management

**Scenario:** Owner updates product stock and logs damage.

**Stock Update Flow:**

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Owner selects product | Product detail displayed with current stock |
| 2 | Owner navigates to Stock > Adjust | Stock adjustment form displayed |
| 3 | Owner enters quantity (+50) | — |
| 4 | Owner selects reason: "Purchase received" | Reference field appears |
| 5 | Owner links to purchase record | — |
| 6 | Owner submits | Stock movement created, product `stockQty` updated |

**Damage Log Flow:**

| Step | Action | System Response |
|------|--------|-----------------|
| 1 | Owner navigates to Stock > Log Damage | Damage form displayed |
| 2 | Owner selects product | Current stock shown |
| 3 | Owner enters quantity (5 units) | — |
| 4 | Owner selects reason code: "expired" | Notes field appears |
| 5 | Owner adds notes and optional image | — |
| 6 | Owner submits | Stock movement created (type: `damage`), `stockQty` reduced |

**Acceptance Criteria:**
- [ ] Stock adjustment creates `stockMovement` document with audit trail
- [ ] `stockMovement` includes `previousQty` and `newQty` for verification
- [ ] Product `stockQty` is updated atomically (transaction)
- [ ] Damage requires `reasonCode` from predefined list
- [ ] Stock badges update immediately on product cards
- [ ] Low stock triggers notification (if below threshold)
- [ ] All stock movements are immutable (append-only log)
- [ ] Owner can view full stock history per product with filters

---

## Appendix A: Firebase Configuration

### Project Configuration

```typescript
// lib/firebase/config.ts
const firebaseConfig = {
  apiKey: "AIzaSyA0CTl7dpdzVYTCvf6iosYIk6s9CRWNqPM",
  authDomain: "meatnbeansco.firebaseapp.com",
  projectId: "meatnbeansco",
  storageBucket: "meatnbeansco.firebasestorage.app",
  messagingSenderId: "760131121480",
  appId: "1:760131121480:web:796555eb44f5c4eebd437d",
  measurementId: "G-HFBL11LG44"
};
```

### Spark Plan Limitations & Workarounds

The Firebase Spark (Free) plan has specific limitations that affect our architecture:

| Feature | Spark Limit | Impact | Workaround |
|---------|-------------|--------|------------|
| **Cloud Functions** | NOT AVAILABLE | Cannot use server-side triggers | Use Next.js API routes + Firebase Admin SDK |
| **Firestore** | 50K reads/day, 20K writes/day | Monitor usage | Aggressive caching, denormalization |
| **Storage** | 5GB total, 1GB/day download | Product images limited | Compress images, use external CDN if needed |
| **Auth** | 10K verifications/month | Phone auth limited | Prefer email auth |
| **Hosting** | 10GB/month transfer | Sufficient for MVP | Use Vercel for hosting instead |

### Architecture Adjustments for Spark Plan

Since Cloud Functions are NOT available on Spark plan, we must restructure:

#### 1. Replace Cloud Function Triggers with Next.js API Routes

```typescript
// INSTEAD OF: Cloud Function trigger on user creation
// functions/index.ts (NOT AVAILABLE)
// export const onUserCreate = functions.auth.user().onCreate(...)

// USE: Next.js API route called after signup
// app/api/auth/setup-user/route.ts
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  const { uid, email, companyId } = await req.json();

  // Create user document
  await adminDb.collection('users').doc(uid).set({
    email,
    companyId,
    role: 'buyer',
    status: 'pending',
    createdAt: new Date()
  });

  // Create subscription document
  await adminDb.collection('subscriptions').doc(uid).set({
    userId: uid,
    companyId,
    status: 'pending',
    createdAt: new Date()
  });

  // Set custom claims
  await adminAuth.setCustomUserClaims(uid, {
    role: 'buyer',
    companyId
  });

  return Response.json({ success: true });
}
```

#### 2. Replace Scheduled Functions with External Cron

```typescript
// INSTEAD OF: Cloud Function scheduled trigger
// functions/index.ts (NOT AVAILABLE)
// export const checkExpiredSubscriptions = functions.pubsub.schedule('every day')...

// USE: External cron service (cron-job.org, Vercel Cron, GitHub Actions)
// app/api/cron/check-subscriptions/route.ts
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check expired subscriptions
  const now = new Date();
  const expiredSubs = await adminDb.collection('subscriptions')
    .where('status', '==', 'active')
    .where('expiryDate', '<', now)
    .get();

  const batch = adminDb.batch();
  expiredSubs.docs.forEach(doc => {
    batch.update(doc.ref, { status: 'expired' });
  });
  await batch.commit();

  return Response.json({ updated: expiredSubs.size });
}
```

#### 3. Client-Side Custom Claims Workaround

Since Cloud Functions cannot set custom claims automatically, handle in API routes:

```typescript
// After user approval by owner
// app/api/admin/approve-user/route.ts
export async function POST(req: Request) {
  const { targetUserId, companyId, role } = await req.json();

  // Verify caller is owner (check token in middleware)

  // Update Firestore
  await adminDb.collection('users').doc(targetUserId).update({
    status: 'active',
    updatedAt: new Date()
  });

  await adminDb.collection('subscriptions').doc(targetUserId).update({
    status: 'active',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    approvedAt: new Date()
  });

  // Set custom claims via Admin SDK
  await adminAuth.setCustomUserClaims(targetUserId, {
    role,
    companyId
  });

  // Revoke tokens to force refresh
  await adminAuth.revokeRefreshTokens(targetUserId);

  return Response.json({ success: true });
}
```

### Environment Variables

```env
# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA0CTl7dpdzVYTCvf6iosYIk6s9CRWNqPM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=meatnbeansco.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=meatnbeansco
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=meatnbeansco.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=760131121480
NEXT_PUBLIC_FIREBASE_APP_ID=1:760131121480:web:796555eb44f5c4eebd437d
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-HFBL11LG44

# Firebase Admin (server-side only - generate from Firebase Console)
FIREBASE_ADMIN_PROJECT_ID=meatnbeansco
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@meatnbeansco.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Cron Secret (generate a secure random string)
CRON_SECRET=your-secure-cron-secret-here

# Feature Flags
NEXT_PUBLIC_PAYMENT_GATEWAY_ENABLED=false
NEXT_PUBLIC_PAYMENT_PROVIDER=manual

# App Config
NEXT_PUBLIC_APP_URL=https://meatnbeansco.vercel.app
NEXT_PUBLIC_DEFAULT_CURRENCY=INR
```

### Generating Firebase Admin Credentials

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract `client_email` and `private_key` for environment variables
5. **NEVER commit this file to git**

---

## Appendix B: API Routes Structure

```
/api
├── /auth
│   ├── /register          POST - Create user
│   ├── /login             POST - Sign in
│   └── /logout            POST - Sign out
├── /products
│   ├── /                  GET - List products (public)
│   ├── /[id]              GET - Product detail
│   └── /admin             CRUD - Admin operations
├── /orders
│   ├── /                  GET - User orders, POST - Create order
│   ├── /[id]              GET - Order detail
│   └── /guest/[id]        GET - Guest order lookup
├── /ledger
│   ├── /[userId]          GET - Ledger summary
│   ├── /[userId]/entries  GET - Ledger entries
│   └── /[userId]/statement POST - Generate statement
├── /payments
│   ├── /                  GET - List payments
│   └── /record            POST - Record manual payment
├── /subscriptions
│   ├── /                  GET - List subscriptions (admin)
│   ├── /[userId]          GET - User subscription
│   └── /approve           POST - Approve subscription
├── /admin
│   ├── /users             CRUD - User management
│   ├── /employees         CRUD - Employee management
│   └── /stock             POST - Stock adjustments
└── /super
    ├── /companies         CRUD - Company management
    ├── /users             CRUD - Global user management
    └── /terminate         POST - User termination
```

---

## Appendix C: Spark Plan Usage Monitoring & Upgrade Path

### Daily Usage Limits (Spark Plan)

| Resource | Daily Limit | Monitoring Strategy |
|----------|-------------|---------------------|
| Firestore reads | 50,000 | Track in app, warn at 80% |
| Firestore writes | 20,000 | Track in app, warn at 80% |
| Firestore deletes | 20,000 | Avoid hard deletes, use soft delete |
| Storage | 5GB total | Compress images, monitor size |
| Storage bandwidth | 1GB/day | Use CDN for high-traffic images |
| Auth verifications | 10,000/month | Prefer email over phone |

### Usage Tracking Implementation

```typescript
// lib/firebase/usage-tracker.ts
// Track Firestore operations client-side for awareness

class UsageTracker {
  private reads = 0;
  private writes = 0;

  trackRead(count = 1) {
    this.reads += count;
    if (this.reads > 40000) { // 80% of 50K
      console.warn('Approaching daily Firestore read limit');
    }
  }

  trackWrite(count = 1) {
    this.writes += count;
    if (this.writes > 16000) { // 80% of 20K
      console.warn('Approaching daily Firestore write limit');
    }
  }

  // Reset daily (call from cron or on app init with date check)
  reset() {
    this.reads = 0;
    this.writes = 0;
  }
}

export const usageTracker = new UsageTracker();
```

### Optimization Strategies for Spark Plan

1. **Aggressive Caching**
   - Cache product catalog in localStorage (5-minute TTL)
   - Use SWR with `revalidateOnFocus: false`
   - Implement pagination with small page sizes (10-15 items)

2. **Denormalization**
   - Store buyer name/phone in orders (avoid user lookups)
   - Store product name/price in order items (avoid product lookups)
   - Cache ledger balance in user document

3. **Batch Operations**
   - Use Firestore batch writes (counts as 1 write per document)
   - Batch multiple updates in single API calls

4. **Image Optimization**
   - Compress images before upload (max 200KB)
   - Use WebP format
   - Consider Cloudinary free tier for CDN (10GB/month)

### Upgrade Path to Blaze Plan

When to upgrade:
- Consistently hitting 80%+ of daily limits
- Need Cloud Functions for real-time triggers
- Need more than 5GB storage
- Need phone authentication at scale

**Blaze Plan Benefits:**
- Pay-as-you-go pricing
- Cloud Functions available
- Higher limits with usage-based billing
- Cloud Storage with more bandwidth

**Migration Steps:**
1. Upgrade plan in Firebase Console
2. Deploy Cloud Functions for triggers (optional)
3. Migrate scheduled cron jobs to Cloud Functions (optional)
4. Enable Cloud Storage CDN

---

## Appendix D: Single-Tenant MVP Simplification

For initial MVP launch, consider starting as single-tenant (Meat N Beans Co. only):

### Simplified Data Model

Remove `companyId` from all collections for MVP:

```typescript
// MVP: Single company, no companyId needed
interface Product {
  id: string;
  name: string;
  sku: string;
  // ... no companyId
}

interface Order {
  id: string;
  userId: string | null;
  // ... no companyId
}
```

### Simplified Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function hasRole(role) {
      return request.auth.token.role == role;
    }

    function isOwnerOrSuper() {
      return hasRole('owner') || hasRole('superMaster');
    }

    // Products - public read, owner write
    match /products/{productId} {
      allow read: if true;
      allow write: if isOwnerOrSuper();
    }

    // Orders - authenticated users
    match /orders/{orderId} {
      allow read: if isOwnerOrSuper() || resource.data.userId == request.auth.uid;
      allow create: if true; // Allow guest orders
      allow update: if isOwnerOrSuper();
    }

    // Users
    match /users/{userId} {
      allow read: if isOwnerOrSuper() || request.auth.uid == userId;
      allow write: if isOwnerOrSuper() || request.auth.uid == userId;
    }

    // Ledgers - owner and self
    match /ledgers/{ledgerId} {
      allow read: if isOwnerOrSuper() || resource.data.userId == request.auth.uid;
      allow write: if isOwnerOrSuper();
    }

    // Payments - owner only
    match /payments/{paymentId} {
      allow read: if isOwnerOrSuper() || resource.data.userId == request.auth.uid;
      allow write: if isOwnerOrSuper();
    }
  }
}
```

### MVP Feature Priority

| Phase | Features | Complexity |
|-------|----------|------------|
| **MVP (Week 1-2)** | Product catalog, cart, guest checkout, order management | Low |
| **Phase 2** | User registration, buyer dashboard, ledger view | Medium |
| **Phase 3** | Manual payments, statements, stock management | Medium |
| **Phase 4** | Subscription system, user approval | High |
| **Phase 5** | Multi-tenant, super master, full admin | High |

---

*End of Product Specification Document*
