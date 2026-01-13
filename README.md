# Monopoly Clone (Next.js + Supabase)

A multiplayer real-estate trading game built with modern web tech.

**Goal**: Real-time multiplayer, reliable state sync, and zero server management (Serverless).

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **State Management**: Zustand (Client-side), Supabase Realtime (Server-sync)
- **Database**: Supabase (PostgreSQL)
- **Styling**: **Material-UI (MUI) with Emotion**

## Architecture Overview

### The "Single Source of Truth" Pattern

We do not use individual SQL tables for properties, houses, or trades. Instead, the entire game state lives in a single JSONB column (`game_state`) in the `rooms` table.

1. **Action**: Player clicks "Buy Property"
2. **Logic**: We call a Supabase RPC or Next.js API route to validate the move
3. **Update**: The server patches the `game_state` JSON (e.g., deducts cash, adds property owner)
4. **Sync**: Supabase Realtime broadcasts the new JSON row to all connected clients
5. **Render**: Zustand receives the update and re-renders the UI

## Directory Structure

```
/src
├── /app               # Next.js App Router
│   ├── /game/[id]     # The actual game room (client-side focused)
│   └── /api           # Serverless functions (verification logic)
├── /components
│   ├── /board         # Visuals: Board, Tiles, Tokens
│   ├── /game          # Logic UI: Dice, Trade Menus, HUD
│   └── /theme         # MUI theme configuration
├── /store             # Zustand stores (Local UI state)
├── /lib               # Supabase client & DB types
├── /types             # Shared TypeScript interfaces (CRITICAL)
└── /constants         # Static data (Board layout, prices, colors)
```

## Database Schema

We use two main tables.

### 1. `rooms`
Tracks the active game session.

```sql
create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,       -- "ABCD" join code
  status text not null,            -- "LOBBY", "PLAYING", "ENDED"
  game_state jsonb default '{}'    -- THE ENTIRE BOARD STATE
);
```

### 2. `players`
Links a user to a room.

```sql
create table players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id),
  name text not null,
  avatar_id string,                -- "top-hat", "car", etc.
  is_host boolean default false
);
```

## State Management (Zustand + Types)

We use Zustand to drive the UI. It mirrors the database state.

### Core Types (`src/types/game.ts`)

This is the contract. Do not break it.

```typescript
export type PlayerId = string;

export interface PlayerState {
  id: PlayerId;
  name: string;
  money: number;
  position: number; // 0-39
  isInJail: boolean;
  jailTurns: number;
}

export interface PropertyState {
  owner: PlayerId | null;
  houses: number; // 0-4 = houses, 5 = hotel
  isMortgaged: boolean;
}

export interface GameState {
  turnIndex: number; // Index of the player array
  players: PlayerState[];
  properties: Record<number, PropertyState>; // Key is board index (0-39)
  lastAction: string; // "Player 1 bought Boardwalk"
  dice: [number, number];
}
```

## MUI Integration

### Theme Configuration (`src/components/theme/theme.ts`)

```typescript
import { createTheme } from '@mui/material/styles';

export const gameTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff4081',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    success: {
      main: '#4caf50',
    },
    warning: {
      main: '#ff9800',
    },
    error: {
      main: '#f44336',
    },
    brown: {
      main: '#8B4513',
    },
    lightBlue: {
      main: '#87CEEB',
    },
    pink: {
      main: '#FF69B4',
    },
    orange: {
      main: '#FF8C00',
    },
    red: {
      main: '#FF0000',
    },
    yellow: {
      main: '#FFD700',
    },
    green: {
      main: '#228B22',
    },
    darkBlue: {
      main: '#00008B',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

declare module '@mui/material/styles' {
  interface Palette {
    brown: Palette['primary'];
    lightBlue: Palette['primary'];
    pink: Palette['primary'];
    orange: Palette['primary'];
    red: Palette['primary'];
    yellow: Palette['primary'];
    green: Palette['primary'];
    darkBlue: Palette['primary'];
  }
  interface PaletteOptions {
    brown?: PaletteOptions['primary'];
    lightBlue?: PaletteOptions['primary'];
    pink?: PaletteOptions['primary'];
    orange?: PaletteOptions['primary'];
    red?: PaletteOptions['primary'];
    yellow?: PaletteOptions['primary'];
    green?: PaletteOptions['primary'];
    darkBlue?: PaletteOptions['primary'];
  }
}
```

### Theme Provider (`src/components/theme/ThemeProvider.tsx`)

```typescript
'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { gameTheme } from './theme';

export default function AppThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={gameTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
```

## Getting Started

### Clone & Install

```bash
git clone https://github.com/armaan-71/monopoly.git
npm install
```

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Run Dev Server

```bash
npm run dev
```

## Development Rules

1. **No Logic in UI**: Do not calculate rent inside a React component. Use helper functions in `/utils/gameLogic.ts`.

2. **Static Data**: Property names, prices, and colors are constant. They live in `/constants/boardConfig.ts`. Do not store "Boardwalk" in the database, only store who owns index 39.

3. **Supabase Types**: If you change the DB schema, run:

```bash
npx supabase gen types typescript --project-id <id> > src/types/supabase.ts
```

4. **MUI Components**: Use MUI components instead of raw HTML elements. Always import components from `@mui/material` and icons from `@mui/icons-material`.

5. **Theme Usage**: Use the theme colors for property groups. For example, use `theme.palette.brown.main` for Brown properties.

6. **Responsive Design**: Utilize MUI's Grid system and breakpoints for responsive layouts instead of writing custom CSS.

## MUI Component Examples

### Example Property Tile Component

```typescript
import { Paper, Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface PropertyTileProps {
  name: string;
  price: number;
  colorGroup: string;
  owner?: string;
  houses?: number;
}

export default function PropertyTile({
  name,
  price,
  colorGroup,
  owner,
  houses = 0,
}: PropertyTileProps) {
  const theme = useTheme();
  
  // Map color group to theme color
  const colorMap: Record<string, string> = {
    brown: theme.palette.brown.main,
    lightBlue: theme.palette.lightBlue.main,
    pink: theme.palette.pink.main,
    orange: theme.palette.orange.main,
    red: theme.palette.red.main,
    yellow: theme.palette.yellow.main,
    green: theme.palette.green.main,
    darkBlue: theme.palette.darkBlue.main,
  };
  
  const backgroundColor = colorMap[colorGroup] || theme.palette.grey[300];
  
  return (
    <Paper
      elevation={3}
      sx={{
        width: 120,
        height: 160,
        display: 'flex',
        flexDirection: 'column',
        border: `2px solid ${backgroundColor}`,
      }}
    >
      <Box
        sx={{
          bgcolor: backgroundColor,
          color: 'white',
          py: 1,
          px: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold">
          {name}
        </Typography>
      </Box>
      <Box sx={{ p: 2, flexGrow: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Price: ${price}
        </Typography>
        {owner && (
          <Typography variant="caption" display="block">
            Owner: {owner}
          </Typography>
        )}
      </Box>
      {houses > 0 && (
        <Box sx={{ p: 1, bgcolor: 'grey.100' }}>
          <Typography variant="caption">
            {houses === 5 ? 'HOTEL' : `${houses} HOUSE${houses > 1 ? 'S' : ''}`}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
```

### Example Game Button Component

```typescript
import { Button } from '@mui/material';
import { LoadingButton } from '@mui/lab';

interface GameButtonProps {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  loading?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  variant?: 'contained' | 'outlined' | 'text';
  startIcon?: React.ReactNode;
}

export default function GameButton({
  onClick,
  label,
  disabled = false,
  loading = false,
  color = 'primary',
  variant = 'contained',
  startIcon,
}: GameButtonProps) {
  if (loading) {
    return (
      <LoadingButton
        loading
        variant={variant}
        color={color}
        disabled={disabled}
        startIcon={startIcon}
        sx={{ minWidth: 120 }}
      >
        {label}
      </LoadingButton>
    );
  }

  return (
    <Button
      variant={variant}
      color={color}
      onClick={onClick}
      disabled={disabled}
      startIcon={startIcon}
      sx={{ minWidth: 120 }}
    >
      {label}
    </Button>
  );
}
```
