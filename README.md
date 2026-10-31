# E-Commerce REST API

A production-grade Node.js REST API built for an e-commerce platform using Express, MongoDB (Mongoose), and JWT authentication.

## Architecture

- **Function-based design**: Clean, modular functions throughout all layers (no classes).
- **Separation of concerns**: Route → Middleware → Controller → Service → Repository → Model → MongoDB.
- **Authentication & RBAC**: JWT-based auth with bcrypt password hashing. Role-based access control (`admin`, `customer`) with fresh database re-verification on each request.
- **Hierarchical Categories**: Self-referencing category model supporting arbitrary nesting depth, ancestor cycle detection, sibling slug uniqueness, restrict-delete policy, and single-query tree retrieval.
- **Product Management**: SKU uniqueness, dynamic effective price calculation (`salePrice` vs `price`), recursive multi-level category filtering (all descendant products included), regex-escaped search, price filtering, sorting, and pagination.
- **Transactional Orders**: Multi-document MongoDB transactions for atomic stock reservation and point-in-time product snapshotting. Order cancellation restores reserved stock in a transaction.
- **Security & Logging**: Helmet headers, CORS, Pino structured logging with credential redaction, centralized error handling, and general + auth-specific rate limiting.

---

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Validation**: Zod
- **Security**: Helmet, express-rate-limit, bcryptjs, jsonwebtoken
- **Logging**: Pino, pino-http

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | Application listener port | `5000` |
| `NODE_ENV` | Environment (`development`, `production`, `test`) | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/ecommerce` |
| `JWT_SECRET` | Secret key for signing tokens | (required, min 32 chars in production) |
| `JWT_EXPIRES_IN` | Token lifespan | `15m` |
| `CLIENT_URL` | Allowed CORS origin | `http://localhost:3000` |
| `ADMIN_EMAIL` | Initial admin email | `admin@ecommerce.example.com` |
| `ADMIN_PASSWORD` | Initial admin password | `AdminPassword123!` |

*Note: In development, if local MongoDB is not running, the application automatically initializes an in-memory replica set with full transaction support.*

### 3. Run the Application
```bash
# Start development server
npm run dev

# Or start directly
node src/server.js

# Optional: Seed initial administrator explicitly
npm run seed:admin
```

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register new customer account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate and obtain JWT token |

### Users
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/users/me` | Authenticated | Get current user profile |
| `PATCH` | `/api/v1/users/me` | Authenticated | Update user profile name |
| `PATCH` | `/api/v1/users/me/password` | Authenticated | Change password |
| `GET` | `/api/v1/admin/users` | Admin | List all users (paginated, role/active filter) |
| `GET` | `/api/v1/admin/users/:id` | Admin | Get user details |
| `PATCH` | `/api/v1/admin/users/:id/status` | Admin | Activate or deactivate user |

### Categories
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/categories/tree` | Public | Get full nested category tree |
| `GET` | `/api/v1/categories` | Public | List categories (supports pagination, parent filter) |
| `GET` | `/api/v1/categories/:id` | Public | Get category details |
| `POST` | `/api/v1/categories` | Admin | Create root or subcategory |
| `PATCH` | `/api/v1/categories/:id` | Admin | Update category (with cycle detection) |
| `DELETE` | `/api/v1/categories/:id` | Admin | Restrict-delete category |

### Products
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/products` | Public | List products (search, category, minPrice, maxPrice, sort, page) |
| `GET` | `/api/v1/products/:id` | Public | Get product details |
| `POST` | `/api/v1/products` | Admin | Create product |
| `PATCH` | `/api/v1/products/:id` | Admin | Update product |
| `DELETE` | `/api/v1/products/:id` | Admin | Delete or soft-archive product |

### Orders
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/v1/orders` | Customer | Place order (transactional stock decrement) |
| `GET` | `/api/v1/orders` | Customer / Admin | List user orders or all orders |
| `GET` | `/api/v1/orders/:id` | Customer / Admin | Get order details |
| `PATCH` | `/api/v1/orders/:id/status` | Customer / Admin | Update status / cancel pending order |
