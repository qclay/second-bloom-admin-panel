# Second Bloom Admin Panel

Modern admin panel for Second Bloom platform built with Next.js 16, React 19, and TypeScript.

## Features

- 🎨 Modern UI with Radix UI components
- 🔐 Authentication and authorization
- 📊 Dashboard with analytics
- 👥 User management
- 📦 Product management
- 🏷️ Category management
- 📝 Order management
- ⭐ Review management
- 📁 File management
- 🔔 Notifications
- 💬 Chat system
- ⚙️ Settings
- 📈 Reports

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: Sonner

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm or yarn
- Backend API running on port 3000

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/admin-panel.git
   cd admin-panel
   ```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
   ```bash
   cp .env.development.example .env.local
   ```

4. **Update environment variables**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   API_BASE_URL=http://localhost:3000
   ```

5. **Run development server**
```bash
npm run dev
```

6. **Open browser**
   ```
   http://localhost:3000
   ```

## Project Structure

```
admin-panel/
├── app/                        # Next.js App Router
│   ├── dashboard/              # Dashboard pages
│   │   ├── categories/         # Categories management
│   │   ├── chat/               # Chat interface
│   │   ├── files/              # File management
│   │   ├── notifications/      # Notifications
│   │   ├── orders/             # Order management
│   │   ├── products/           # Product management
│   │   ├── reports/            # Reports and analytics
│   │   ├── reviews/            # Review management
│   │   ├── settings/           # Settings
│   │   ├── users/              # User management
│   │   └── layout.tsx          # Dashboard layout
│   ├── login/                  # Login page
│   ├── api/                    # API routes
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── providers.tsx           # React Query provider
├── components/                 # Reusable components
│   └── ui/                     # UI components
├── lib/                        # Utility libraries
│   ├── api-client.ts           # API client setup
│   ├── auth-store.ts           # Auth state management
│   └── utils.ts                # Helper functions
├── services/                   # API services
│   ├── auth.service.ts         # Authentication
│   ├── category.service.ts     # Categories
│   ├── file.service.ts         # Files
│   ├── order.service.ts        # Orders
│   ├── product.service.ts      # Products
│   └── user.service.ts         # Users
├── types/                      # TypeScript types
│   └── index.ts                # Type definitions
├── public/                     # Static assets
├── scripts/                    # Deployment scripts
├── .github/                    # GitHub Actions
└── docker-compose.yml          # Docker configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

### Docker Deployment

See [SETUP.md](./SETUP.md) for quick setup or [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment guide.

**Quick Deploy:**

```bash
# Build and run with Docker
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

### CI/CD with GitHub Actions

Automated deployment is configured for:
- **`main` branch** → Production
- **`staging` branch** → Staging
- **`develop` branch** → Development

See [DEPLOYMENT.md](./DEPLOYMENT.md) for GitHub Actions setup.

## Environment Variables

### Development
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000
```

### Production
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
API_BASE_URL=https://api.yourdomain.com
PORT=3001
```

See `.env.*.example` files for all available options.

## API Integration

The admin panel connects to a backend API. Configure the API URL in your environment file:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

API client is configured in `lib/api-client.ts` with:
- Automatic authentication token handling
- Request/response interceptors
- Error handling
- Base URL configuration

## Authentication

Authentication is handled by Zustand store (`lib/auth-store.ts`):

```typescript
import { useAuthStore } from '@/lib/auth-store';

// In components
const { user, login, logout } = useAuthStore();
```

## Development

### Adding New Pages

1. Create page in `app/dashboard/[page-name]/page.tsx`
2. Add to navigation in `app/dashboard/layout.tsx`
3. Create service if needed in `services/`
4. Add types in `types/index.ts`

### Adding API Services

```typescript
// services/example.service.ts
import apiClient from '@/lib/api-client';

export const exampleService = {
  getAll: () => apiClient.get('/examples'),
  getById: (id: string) => apiClient.get(`/examples/${id}`),
  create: (data: any) => apiClient.post('/examples', data),
  update: (id: string, data: any) => apiClient.put(`/examples/${id}`, data),
  delete: (id: string) => apiClient.delete(`/examples/${id}`),
};
```

### Using React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { exampleService } from '@/services/example.service';

// Fetch data
const { data, isLoading } = useQuery({
  queryKey: ['examples'],
  queryFn: exampleService.getAll,
});

// Mutate data
const mutation = useMutation({
  mutationFn: exampleService.create,
  onSuccess: () => {
    // Handle success
  },
});
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Documentation

- **[SETUP.md](./SETUP.md)** - Quick setup guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[Next.js Docs](https://nextjs.org/docs)** - Next.js documentation
- **[React Query Docs](https://tanstack.com/query/latest)** - React Query documentation

## Support

- GitHub Issues: Report bugs and request features
- Documentation: See `DEPLOYMENT.md` and `SETUP.md`

## License

MIT

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Maintained By**: Second Bloom Development Team
