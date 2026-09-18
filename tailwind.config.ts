import tailwindcssAnimate from "tailwindcss-animate";
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        /**
         * Brend yuzasi — header, hero va footer foni.
         *
         * NEGA `primary` DAN AJRATILGAN:
         *   `--primary` bir vaqtda fon (bg-primary, 90 joy) va urg'u matni
         *   (text-primary, 159 joy) sifatida ishlatiladi. Dark rejimda matn
         *   o'qilishi uchun u yorug'roq bo'lishi SHART, lekin saytning
         *   siyohrang brend foni yorug'lashib ketmasligi kerak.
         *   Ikkala talabni bitta o'zgaruvchi bajara olmaydi.
         */
        brand: {
          DEFAULT: "hsl(var(--brand))",
          foreground: "hsl(var(--brand-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
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
        "nav-active": "hsl(var(--nav-active))",
        "nav-hover": "hsl(var(--nav-hover))",
        "question-bg": "hsl(var(--question-bg))",
        "answer-hover": "hsl(var(--answer-hover))",
        "image-border": "hsl(var(--image-border))",
        /**
         * CTA tugmalari — YAGONA manba.
         *
         * Nega config'da: `bg-[hsl(var(--cta-orange))]` ko'rinishidagi uzun
         * yozuv qo'l bilan qattiq hex yozishga undardi va natijada bir xil
         * vazifadagi tugmalar (header "Kirish" va hero "Variantlar") ikki
         * xil to'q sariqda chiqib qolgandi. Qisqa `bg-cta-orange` shaklida
         * chetga chiqishning sababi qolmaydi.
         */
        cta: {
          orange: "hsl(var(--cta-orange) / <alpha-value>)",
          "orange-hover": "hsl(var(--cta-orange-hover) / <alpha-value>)",
          green: "hsl(var(--cta-green) / <alpha-value>)",
          "green-hover": "hsl(var(--cta-green-hover) / <alpha-value>)",
          red: "hsl(var(--cta-red) / <alpha-value>)",
          "red-hover": "hsl(var(--cta-red-hover) / <alpha-value>)",
          blue: "hsl(var(--cta-blue) / <alpha-value>)",
          "blue-hover": "hsl(var(--cta-blue-hover) / <alpha-value>)",
        },
        pro: {
          DEFAULT: "hsl(var(--pro))",
          hover: "hsl(var(--pro-hover))",
          foreground: "hsl(var(--pro-foreground))",
          bg: "hsl(var(--pro-bg))",
          "bg-end": "hsl(var(--pro-bg-end))",
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
