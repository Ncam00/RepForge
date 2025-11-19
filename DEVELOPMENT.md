# RepForge Development Guide

## Project Structure

```
repforge/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Base UI components
│   └── providers.tsx     # Context providers
├── lib/                   # Utility functions
│   ├── db.ts             # Prisma client
│   └── utils.ts          # Helper utilities
├── prisma/               # Database
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── public/               # Static assets
└── types/                # TypeScript definitions
```

## Getting Started

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

### 3. Initialize Database

```bash
npm run db:push     # Create database schema
npm run db:seed     # Populate with sample data
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Credentials

- **Email**: demo@repforge.com
- **Password**: password123

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with sample data

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (Prisma ORM)
- **Authentication**: NextAuth.js v5
- **UI Components**: Radix UI
- **State Management**: TanStack Query
- **Charts**: Recharts
- **Icons**: Lucide React

## Database Schema

### Core Models

- **User** - User accounts and authentication
- **Weight** - Body weight tracking entries
- **WorkoutSplit** - Training split templates
- **SplitDay** - Individual days in a split
- **Exercise** - Exercise library
- **WorkoutSession** - Completed workout sessions
- **ExerciseSet** - Individual sets within sessions
- **PersonalRecord** - PR tracking

## Feature Development Workflow

### Creating a New Feature Branch

```bash
git checkout -b feature/feature-name
```

### Committing Changes

```bash
git add .
git commit -m "Add feature description"
```

### Merging to Main

```bash
git checkout main
git merge feature/feature-name
git branch -d feature/feature-name
```

## Roadmap Status

- [x] Project initialization
- [x] Database schema
- [x] Authentication system
- [ ] Weight tracking (v1.0)
- [ ] Training splits (v1.0)
- [ ] Exercise library (v1.1)
- [ ] Session history (v1.1)
- [ ] PR tracking (v1.2)
- [ ] Progressive overload (v1.3)

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Commit with clear messages (no emojis)
5. Merge to main when complete

## Troubleshooting

### Database Issues

```bash
# Reset database
rm prisma/dev.db
npm run db:push
npm run db:seed
```

### Dependency Conflicts

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/primitives)
- [NextAuth.js](https://next-auth.js.org/)
