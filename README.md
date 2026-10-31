# E-Commerce Backend API

REST API for an e-commerce platform built with Node.js, Express, MongoDB, and JWT authentication.

## Features

- **Authentication & RBAC**: JWT auth with bcrypt password hashing. Roles for `admin` and `customer` with immediate status verification on each request.
- **Hierarchical Categories**: Self-referencing Mongoose model supporting unlimited nesting depth, cycle detection, slug uniqueness among siblings, and single-query tree retrieval.
- **Product Catalog**: SKU uniqueness, dynamic effective pricing (`salePrice` vs `price`), recursive category filtering (matching subcategory items), text search, price filters, and pagination.
- **Orders & Inventory**: Multi-document MongoDB transactions for checkout with atomic stock decrementing (`$inc`). Order cancellation automatically restores stock.
- **Security & Reliability**: Helmet headers, CORS, rate limiting, Pino request logging, and centralized error handling with Zod input validation.
- **Documentation**: Interactive OpenAPI 3.0 spec at `/api/v1/docs` and ready-to-import `postman_collection.json`.

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB >= 6.0 (replica set required for transactions) or Docker

### Installation

1. Clone repository and install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure variables in `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ecommerce
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters
JWT_EXPIRES_IN=15m
CLIENT_URL=http://localhost:3000
ADMIN_EMAIL=admin@ecommerce.example.com
ADMIN_PASSWORD=AdminPassword123!
```

*Note: In development, if a local MongoDB instance is not detected, the server automatically starts an in-memory replica set with full transaction support.*

4. Start the server:
```bash
# Development mode
npm run dev

# Production
npm start

# Seed default admin user (optional)
npm run seed:admin
```

---

## Docker Setup

To run the API along with a MongoDB replica set container:

```bash
docker compose up --build
```

The API will be available at `http://localhost:5000`.

---

## API Documentation

- **OpenAPI / Swagger Spec**: Available at `http://localhost:3000/api/v1/docs` (or `http://localhost:5000/api/v1/docs` via Docker).
- **Postman**: Import `postman_collection.json` into Postman. Variables `baseUrl`, `adminToken`, and `customerToken` are configured, and login scripts automatically save tokens to collection variables.

---

## Endpoints Overview

### Auth
- `POST /api/v1/auth/register` - Register a customer account
- `POST /api/v1/auth/login` - Authenticate and get JWT

### Users
- `GET /api/v1/users/me` - Current user profile
- `PATCH /api/v1/users/me` - Update profile name
- `PATCH /api/v1/users/me/password` - Change password
- `GET /api/v1/admin/users` - Admin: list users (supports pagination, role, isActive filter)
- `PATCH /api/v1/admin/users/:id/status` - Admin: activate / deactivate user

### Categories
- `GET /api/v1/categories/tree` - Get full category hierarchy tree
- `GET /api/v1/categories` - List categories (paginated, parent filter)
- `GET /api/v1/categories/:id` - Get category by ID
- `POST /api/v1/categories` - Admin: create category
- `PATCH /api/v1/categories/:id` - Admin: update category (with cycle detection)
- `DELETE /api/v1/categories/:id` - Admin: delete category (restricted if has children/products)

### Products
- `GET /api/v1/products` - List products (search, category, minPrice, maxPrice, sortBy, order, page, limit)
- `GET /api/v1/products/:id` - Get product by ID
- `POST /api/v1/products` - Admin: create product
- `PATCH /api/v1/products/:id` - Admin: update product
- `DELETE /api/v1/products/:id` - Admin: delete or soft-archive product

### Orders
- `POST /api/v1/orders` - Customer: place order (atomic stock decrement)
- `GET /api/v1/orders` - List orders (customer views own; admin views all)
- `GET /api/v1/orders/:id` - Get order by ID
- `PATCH /api/v1/orders/:id/status` - Update status (pending → confirmed → processing → shipped → delivered / cancelled)
