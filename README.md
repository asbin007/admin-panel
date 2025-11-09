# Admin Panel - Nike Dashboard

## Overview

A comprehensive Next.js-based admin dashboard for the Nike e-commerce platform. Provides administrators with powerful tools to manage products, orders, inventory, analytics, and customer support.

## 🎯 Features

**Product Management:**
- Add, edit, and delete products
- Manage product categories and collections
- Track cost price and calculate profit margins
- Image management with Cloudinary integration
- Bulk operations and inventory management

**Order Management:**
- View and process orders
- Track order status and payments
- Handle order fulfillment
- Generate invoices and receipts

**Inventory & Analytics:**
- Real-time inventory tracking
- Sales analytics and reporting
- Profit analysis dashboard
- Revenue statistics
- Customer analytics

**Customer Support:**
- Real-time chat with customers
- Support ticket management
- Chat history and transcripts
- Customer communication tools

**Admin Tools:**
- User management
- Role-based access control
- Activity logs and audit trails
- System settings and configuration
- Backup and data management

## 🛠️ Tech Stack

**Frontend Framework:**
- Next.js 14+ - React framework with SSR/SSG
- TypeScript - Type safety
- Tailwind CSS - Utility-first CSS framework

**State Management & Data Fetching:**
- Redux Toolkit - State management
- RTK Query - Server state management
- Axios - HTTP client

**Real-time Features:**
- Socket.io - Real-time communication

**UI Components & Utilities:**
- React Hook Form - Form management
- Zod - Schema validation
- Chart.js / Recharts - Data visualization
- React Toastify - Notifications

## 📦 Installation

### Prerequisites
- Node.js 16+ (or higher)
- npm or yarn
- Nike Backend API running locally or deployed

### Setup

```bash
# Clone the repository
git clone https://github.com/asbin007/admin-panel.git
cd admin-panel

# Install dependencies
npm install
# or
yarn install

# Create .env file
cp .env.example .env.local

# Start development server
npm run dev
# or
yarn dev
```

## 🔧 Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Admin Authentication
NEXT_PUBLIC_ADMIN_EMAIL=admin@example.com

# Image Upload
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# Other Configurations
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📁 Project Structure

```
app/
├── (auth)/               # Authentication pages
├── dashboard/           # Main dashboard
├── products/            # Product management
├── orders/              # Order management
├── analytics/           # Analytics and reports
├── customers/           # Customer management
├── chat/                # Chat interface
├── settings/            # Admin settings
└── layout.tsx           # Root layout

components/
├── shared/              # Shared components
├── forms/               # Form components
├── charts/              # Chart components
└── modals/              # Modal components

lib/
├── api.ts               # API client
├── constants.ts         # Constants
└── utils.ts             # Utility functions

store/
├── slices/              # Redux slices
└── index.ts             # Store configuration
```

## 🚀 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type check
npm run type-check

# Lint code
npm run lint
```

### Development Server

The admin panel runs at `http://localhost:3000` by default.

## 🔗 Connected Services

**Nike Backend API:**
- Repository: [nike-backend](https://github.com/asbin007/nike-backend)
- API Base URL: `http://localhost:5000/api`
- Real-time Chat: Socket.io connection

**Frontend Application:**
- Repository: [nike-frontend](https://github.com/asbin007/nike-frontend)

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🌐 Deployment

Recommended deployment platforms:

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Other deployment options:
- Netlify
- AWS Amplify
- Digital Ocean
- Railway.app

## 🔔 Authentication & Security

- Admin login with email and password
- JWT token-based authentication
- Role-based access control (RBAC)
- Secure session management
- Environment-based API keys

## 📈 Key Features

### Dashboard Overview
- Real-time sales statistics
- Revenue and profit metrics
- Top-selling products
- Recent orders
- Customer activity

### Inventory Management
- Stock level monitoring
- Low stock alerts
- Bulk inventory updates
- Inventory forecasting

### Financial Reports
- Profit & loss statement
- Revenue analysis
- Product cost tracking
- Margin analysis

## 🙋 Support & Documentation

For issues, questions, or suggestions:
- Open an issue in the [repository](https://github.com/asbin007/admin-panel/issues)
- Check the [Nike Backend](https://github.com/asbin007/nike-backend) documentation

## 🤝 Integration with Nike Ecosystem

This admin panel is part of the Nike e-commerce ecosystem:

1. **nike-backend** - Node.js/Express API server
2. **nike-frontend** - React customer frontend
3. **admin-panel** - Next.js admin dashboard (this repo)

## 📝 License

ISC License

## 🤓 Getting Help

- Review the [Nike Backend documentation](https://github.com/asbin007/nike-backend)
- Check existing issues and discussions
- Contact the development team
