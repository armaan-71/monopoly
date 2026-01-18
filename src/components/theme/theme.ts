"use client";

import { createTheme } from "@mui/material/styles";
import { Inter } from "next/font/google";

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

// Extend the palette types to include custom Monopoly colors and new semantic tokens
declare module "@mui/material/styles" {
  interface Palette {
    brown: Palette["primary"];
    lightBlue: Palette["primary"];
    pink: Palette["primary"];
    orange: Palette["primary"];
    red: Palette["primary"];
    yellow: Palette["primary"];
    green: Palette["primary"];
    darkBlue: Palette["primary"];
    // New UI tokens
    surface: Palette["primary"];
  }
  interface PaletteOptions {
    brown?: PaletteOptions["primary"];
    lightBlue?: PaletteOptions["primary"];
    pink?: PaletteOptions["primary"];
    orange?: PaletteOptions["primary"];
    red?: PaletteOptions["primary"];
    yellow?: PaletteOptions["primary"];
    green?: PaletteOptions["primary"];
    darkBlue?: PaletteOptions["primary"];
    surface?: PaletteOptions["primary"];
  }
}

export const gameTheme = createTheme({
  typography: {
    fontFamily: inter.style.fontFamily,
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  palette: {
    mode: "dark", // Enable Dark Mode
    background: {
      default: "#121212", // Ultra dark grey, standard Material Dark
      paper: "#1E1E1E", // Slightly lighter for cards
    },
    text: {
      primary: "#ffffff",
      secondary: "rgba(255, 255, 255, 0.7)",
    },
    primary: {
      main: "#90caf9", // Softer blue for dark mode
    },
    secondary: {
      main: "#f48fb1",
    },
    surface: {
      main: "#2C2C2C", // Custom surface color for panels
    },
    // Monopoly Colors (Adjusted for Dark Mode contrast if needed, but standard usually works)
    brown: { main: "#8B4513" },
    lightBlue: { main: "#87CEEB" },
    pink: { main: "#FF69B4" },
    orange: { main: "#FF8C00" },
    red: { main: "#FF0000" },
    yellow: { main: "#FFD700" },
    green: { main: "#228B22" },
    darkBlue: { main: "#00008B" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#121212",
          scrollbarWidth: "thin",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none", // Remove default gradient
          backgroundColor: "#1E1E1E",
          borderRadius: 12,
          border: "1px solid rgba(255, 255, 255, 0.08)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 16px",
        },
        contained: {
          boxShadow: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});
