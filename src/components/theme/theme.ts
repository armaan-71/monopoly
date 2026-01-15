"use client";

import { createTheme } from "@mui/material/styles";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

// Extend the palette types to include custom Monopoly colors
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
  }
}

export const gameTheme = createTheme({
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
  palette: {
    mode: "dark",
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
    primary: {
      main: "#90caf9", // Light blue often good for dark mode
    },
    text: {
      primary: "#ffffff",
      secondary: "rgba(255, 255, 255, 0.7)",
    },
    // Monopoly Colors
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
        html: {
          height: "100%",
        },
        body: {
          height: "100%",
          margin: 0,
          padding: 0,
          backgroundColor: "#121212 !important", // Force dark background
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});
