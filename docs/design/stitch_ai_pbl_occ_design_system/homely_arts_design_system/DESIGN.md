---
name: Homely Arts
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0daee'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff3ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dfe9fc'
  surface-container-highest: '#d9e3f7'
  on-surface: '#121c2a'
  on-surface-variant: '#4a4453'
  inverse-surface: '#273140'
  inverse-on-surface: '#ebf1ff'
  outline: '#7b7485'
  outline-variant: '#ccc3d6'
  surface-tint: '#6f43c1'
  primary: '#420093'
  on-primary: '#ffffff'
  primary-container: '#592aaa'
  on-primary-container: '#c7aaff'
  inverse-primary: '#d3bbff'
  secondary: '#712ae2'
  on-secondary: '#ffffff'
  secondary-container: '#8b4bfc'
  on-secondary-container: '#fffbff'
  tertiary: '#3c2173'
  on-tertiary: '#ffffff'
  tertiary-container: '#533a8b'
  on-tertiary-container: '#c5abff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ebddff'
  primary-fixed-dim: '#d3bbff'
  on-primary-fixed: '#250059'
  on-primary-fixed-variant: '#5726a7'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d1bcff'
  on-tertiary-fixed: '#24005b'
  on-tertiary-fixed-variant: '#503788'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f7'
  status-active: '#10b981'
  status-warning: '#f59e0b'
  status-error: '#ef4444'
  grid-border: '#e5e7eb'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 132px
    fontWeight: '900'
    lineHeight: 140px
    letterSpacing: 0.02em
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '900'
    lineHeight: 56px
    letterSpacing: 0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-bold:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  table-cell:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 16px
  max-width: 1280px
---

## Brand & Style

Homely Arts is a vibrant, community-focused platform for performance arts, ranging from indie rock and university theater to traditional dance. The brand identity balances **cinematic drama** with **digital accessibility**, aiming to evoke the excitement of a live performance even before the ticket is booked.

The design style is **Modern Glassmorphism with a Tactile Edge**. It uses high-contrast typography and atmospheric background elements (like the "rain" and "ticket perforation" textures) to create a sense of depth and place. The UI feels premium and curated, using subtle motion and glow effects to guide the user's attention toward featured performances. It is designed to feel like a digital "stage" where the posters are the stars.

## Colors

The palette is anchored in **Deep Amethyst (#420093)** and **Electric Violet (#712ae2)**, colors that traditionally represent creativity and theatricality. These are set against a clean, high-luminance background to maintain readability.

- **Primary & Secondary:** Used for branding, calls to action, and highlighting active states.
- **Surface Strategy:** We utilize a "Surface-White" base with "Surface-Container" tiers (light blues/lavenders) to create subtle differentiation between sections without heavy borders.
- **Atmospheric Accents:** Semi-transparent versions of the neutral and primary colors are used for decorative background layers, creating the "Rain" and "Glow" effects that provide the platform's signature depth.

## Typography

The system relies exclusively on **Inter** to maintain a modern, systematic feel that doesn't compete with the diverse aesthetic of show posters. 

The hierarchy is extremely high-contrast. **Display Hero** levels are used for the main landing page value proposition, utilizing massive weights (900) and negative letter spacing to create a "poster-like" feel. Secondary headlines use semi-bold weights for clear section breaks. **Label Caps** are used for genres (e.g., "MUSICAL") to provide a clear, metadata-driven structure that feels organized and professional.

## Layout & Spacing

The layout follows a **Hybrid Grid** approach. Content is constrained to a max-width of 1280px (7xl) but allows background textures and decorative elements to bleed into the edges.

- **Vertical Rhythm:** Large vertical gaps (80px to 128px) are used between major landing sections to provide "breathing room" for the cinematic background effects.
- **Grid System:** We use a responsive grid that shifts from 1 column on mobile to 5 columns on desktop for "Trending" cards, and 2 columns for "List" views.
- **Sticky Elements:** The filter bar and navigation use sticky positioning with backdrop-blur to maintain context while scrolling through dense lists of shows.

## Elevation & Depth

Depth is conveyed through **Z-Axis Layering** rather than traditional heavy shadows:
- **Layer 0 (Background):** Subtle SVG textures and perforation patterns.
- **Layer 10 (Atmospheric):** Interactive "Rain" elements that react to hover.
- **Layer 20 (Surface):** The main content body, often utilizing `backdrop-blur` and low-opacity fills (`surface/40`) to remain light.
- **Layer 30 (Interactive):** Cards and buttons. Elevation is shown via **shadow-sm** that transforms into **shadow-xl** on hover, accompanied by a slight upward translation (-8px) to signify interactivity.

## Shapes

The shape language is **geometric yet friendly**. 
- **Standard Cards:** Use a 12px (rounded-xl) corner radius to feel modern and polished.
- **Chips & Tags:** Use full pill shapes (rounded-full) to distinguish metadata from content blocks.
- **Media:** Performance posters maintain sharp or slightly rounded (8px) edges to respect the original artwork's framing.

## Components

### Buttons
Primary buttons are pill-shaped with a solid fill and a subtle `glow-dot` or `animate-ping` effect to draw attention. Secondary buttons use a light-themed container (`primary/10`) with high-contrast text.

### Cards (Premium Show Cards)
Cards use an aspect ratio of 1:1.414 (standard poster size). They feature a "glass" badge in the top right for ratings and use a clean white base for information. Hover states trigger a scale effect on the image and a color shift in the title.

### Filter Chips
Pill-shaped containers with 1px borders. Active states use the solid primary color with a ping animation to signify a live filter selection.

### List Items (Horizontal)
For secondary exploration, list items are horizontal and include more metadata (date, price tiers) with a clear "View Details" call to action.

### Atmospheric Elements
Custom "Rain" and "Glow" components should be used sparingly in the background to provide texture. These are `pointer-events-none` to ensure they do not interfere with the primary UI interaction.