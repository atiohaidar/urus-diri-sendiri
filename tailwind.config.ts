import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "420px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        handwriting: ['Patrick Hand', 'cursive'],
      },
      colors: {
        // Core colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          muted: "hsl(var(--success-muted))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Notebook-specific colors
        paper: {
          DEFAULT: "hsl(var(--paper))",
          lines: "hsl(var(--paper-lines))",
          margin: "hsl(var(--paper-margin))",
        },
        ink: "hsl(var(--ink))",
        pencil: "hsl(var(--pencil))",
        sticky: {
          yellow: "hsl(var(--sticky-yellow))",
          pink: "hsl(var(--sticky-pink))",
          blue: "hsl(var(--sticky-blue))",
          green: "hsl(var(--sticky-green))",
        },
        highlighter: {
          DEFAULT: "hsl(var(--highlighter-yellow))",
          yellow: "hsl(var(--highlighter-yellow))",
          pink: "hsl(var(--highlighter-pink))",
          blue: "hsl(var(--highlighter-blue))",
        },
        doodle: {
          primary: "hsl(var(--doodle-primary))",
          red: "hsl(var(--doodle-red))",
          green: "hsl(var(--doodle-green))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        'card': 'var(--card-shadow)',
        'card-hover': 'var(--card-shadow-hover)',
        'tape': 'var(--shadow-tape)',
        'sticky': 'var(--shadow-sticky)',
        'sticky-hover': 'var(--shadow-sticky-hover)',
        // Optimized shadows for mobile - simpler, less layers
        'notebook': '2px 2px 0 0 rgba(0,0,0,0.08)',
        'notebook-hover': '3px 3px 0 0 rgba(0,0,0,0.1)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(100%)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "check": {
          from: { transform: "scale(0)" },
          to: { transform: "scale(1)" },
        },
        // Notebook-specific animations - GPU optimized
        "wobble": {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1deg)" },
        },
        "scribble-in": {
          from: { strokeDashoffset: "100", opacity: "0" },
          to: { strokeDashoffset: "0", opacity: "1" },
        },
        "tape-flutter": {
          "0%, 100%": { transform: "translateX(-50%) rotate(-2deg)" },
          "50%": { transform: "translateX(-50%) rotate(-3deg)" },
        },
        "sticky-drop": {
          from: { opacity: "0", transform: "translateY(-20px) rotate(-5deg)" },
          to: { opacity: "1", transform: "translateY(0) rotate(var(--rotation, -1deg))" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scale-in 0.15s ease-out",
        "check": "check 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        // Notebook animations
        "wobble": "wobble 4s ease-in-out infinite",
        "scribble": "scribble-in 0.4s ease-out forwards",
        "tape-flutter": "tape-flutter 3s ease-in-out infinite",
        "sticky-drop": "sticky-drop 0.3s ease-out forwards",
      },
      // Performance: contain property for layout optimization
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
      },
      // Optimize for 60fps - shorter durations
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
