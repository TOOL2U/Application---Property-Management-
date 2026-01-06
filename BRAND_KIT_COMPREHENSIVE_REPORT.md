# BookMate Mobile Application Brand Kit Report

**To**: PM Application Engineer  
**From**: Mobile Development Team  
**Date**: January 4, 2026  
**Subject**: Comprehensive Brand Kit Documentation for Property Management Application Alignment  

---

## Executive Summary

This report provides a comprehensive analysis of the BookMate Mobile Application's brand kit, design system, and visual identity to ensure consistency across all Sia Moon property management business applications. The brand kit follows a **premium dark theme** with **yellow accent highlights**, creating a sophisticated and professional appearance suitable for financial and property management applications.

---

## 📊 Brand Identity Overview

### Company Information
- **Application**: BookMate Mobile App
- **Company**: Sia Moon Co., Ltd.
- **Bundle ID**: com.siamoon.bookmate
- **Business Sector**: Property Management & Financial Accounting
- **Target Audience**: Property managers, business owners, financial professionals

### Brand Positioning
- **Professional**: Dark theme conveys sophistication and reliability
- **Modern**: Clean minimalist design with subtle animations
- **Trustworthy**: Consistent visual hierarchy and clear information architecture
- **Premium**: High-contrast design with selective use of brand colors

---

## 🎨 Color Palette

### Primary Brand Colors

```
BRAND YELLOW: #FFF02B
└── Primary accent color
└── Used for: buttons, highlights, icons, active states
└── Psychological impact: Energy, attention, premium feel
└── Usage: Sparingly for maximum impact

BRAND BLACK: #000000
└── Primary structural color
└── Used for: navbar, cards, UI dividers
└── Psychological impact: Sophistication, authority, trust

BRAND GREY PRIMARY: #121212
└── Main background color
└── Used for: app background, primary surfaces
└── Creates depth and modern feel
```

### Secondary Color System

```
GREY SECONDARY: #4D4D4D
└── Content blocks, secondary text backgrounds
└── Provides contrast hierarchy

SURFACE COLORS:
├── SURFACE_1: #1A1A1A (slightly lighter cards)
├── SURFACE_2: #2A2A2A (elevated elements)
└── Creates visual depth and layering
```

### Text Color Hierarchy

```
TEXT_PRIMARY: #FFFFFF
├── High-contrast white text
└── Used on dark backgrounds

TEXT_SECONDARY: #B3B3B3
├── Secondary text with good contrast
└── Used for labels, descriptions

TEXT_MUTED: #4D4D4D
├── Muted text matching secondary grey
└── Used for subtle information
```

### Status & Feedback Colors

```
SUCCESS: #00FF88 (bright green)
ERROR: #FF3366 (vibrant red)
WARNING: #FFA500 (orange)
INFO: #FFF02B (brand yellow)
```

### Border System

```
BORDER: #4D4D4D (primary borders)
BORDER_SUBTLE: #2A2A2A (subtle dividers)
ACTIVE: #FFF02B (active state borders)
INACTIVE: #4D4D4D (inactive elements)
```

---

## 🎯 Logo & Brand Marks

### Primary Logo: BM Monogram

**File**: `/assets/images/bm-logo.svg`
**Format**: SVG Vector (4000x4000px viewBox)
**Color**: #FFF02B (Brand Yellow)

#### Logo Characteristics:
- **Style**: Modern sans-serif monogram
- **Letters**: "B" and "M" interlocked
- **Usage**: Official brand representation
- **Scalability**: Vector format ensures crisp display at all sizes

#### Logo Implementation:
```tsx
// React Component Usage
<LogoBM size={128} />  // Large (splash, login)
<LogoBM size={80} />   // Medium (headers)
<LogoBM size={48} />   // Small (navigation)
```

#### Logo Protection Rules:
- ⚠️ **CRITICAL**: Do not modify logo design, proportions, or styling
- ✅ Always maintain aspect ratio
- ✅ Use only brand yellow (#FFF02B) color
- ✅ Ensure minimum clear space around logo

### App Icon
**File**: `/assets/icon.png`
**Dimensions**: 1024×1024 pixels
**Size**: 1.2 MB
**Format**: PNG with transparency

---

## 📱 Typography System

### Font Family Hierarchy

```
PRIMARY: 'Aileron-Bold'
├── Used for: buttons, headers, emphasis
├── Weight: Bold (700)
├── Style: Modern sans-serif
└── Files: Aileron-Bold.otf

SECONDARY: 'Aileron-Regular'
├── Used for: body text, general content
├── Weight: Regular (400)
├── Style: Clean, readable
└── Files: Aileron-Regular.otf

LIGHT: 'Aileron-Light'
├── Used for: subtle text, secondary info
├── Weight: Light (300)
├── Style: Elegant, minimal
└── Files: Aileron-Light.otf

DISPLAY: 'BebasNeue-Regular'
├── Used for: large numbers, statistics
├── Weight: Regular
├── Style: Condensed, impactful
└── Files: BebasNeue-Regular.ttf

ACCENT: 'MadeMirage-Regular'
├── Used for: special headings, branding
├── Weight: Regular
├── Style: Elegant, premium
└── Files: MadeMirage-Regular.otf, MadeMirage-Regular.ttf
```

### Type Scale

```
LARGE TITLE: 18px / 22px line-height
MEDIUM TITLE: 16px / 20px line-height
SMALL TITLE: 14px / 18px line-height

BODY: 16px / 24px line-height
CAPTION: 14px / 20px line-height
SMALL: 12px / 16px line-height
```

### Text Styling Rules

```
BUTTON TEXT:
├── Transform: UPPERCASE
├── Weight: 600 (semi-bold)
├── Letter-spacing: 0.5px
├── Color: Based on button variant

HEADERS:
├── Weight: Bold
├── Color: TEXT_PRIMARY (#FFFFFF)
├── Margin: Consistent spacing

BODY TEXT:
├── Weight: Regular
├── Color: TEXT_SECONDARY (#B3B3B3)
├── Line-height: 1.5
```

---

## 🏗️ Layout & Spacing System

### Spacing Scale

```
XS: 4px   (micro spacing)
SM: 8px   (small gaps)
MD: 12px  (medium spacing)
LG: 16px  (large spacing, standard)
XL: 20px  (extra large)
XXL: 24px (maximum spacing)
```

### Grid System

```
CONTAINER PADDING: 16px (LG)
SECTION SPACING: 24px (XXL)
CARD SPACING: 16px (LG)
ELEMENT SPACING: 12px (MD)
ICON SPACING: 8px (SM)
```

### Border Radius Philosophy

```
COMPONENTS: 0px (sharp, modern)
├── Buttons: 0px radius
├── Cards: 0px radius
├── Inputs: 0px radius
└── Creates consistent, professional look

SPECIAL CASES:
├── Circular elements (icons, avatars)
├── Maintains sharp rectangular aesthetic
```

---

## 🎪 Shadow & Elevation System

### Yellow Glow Effects

```
SMALL GLOW:
├── Color: #FFF02B (Brand Yellow)
├── Offset: 0, 2px
├── Opacity: 0.1
├── Radius: 4px
├── Used for: subtle highlights

MEDIUM GLOW:
├── Color: #FFF02B
├── Offset: 0, 4px
├── Opacity: 0.15
├── Radius: 8px
├── Used for: important elements

LARGE GLOW:
├── Color: #FFF02B
├── Offset: 0, 8px
├── Opacity: 0.2
├── Radius: 16px
├── Used for: prominent elements

YELLOW_GLOW (Special):
├── Color: #FFF02B
├── Offset: 0, 0px (no offset)
├── Opacity: 0.3
├── Radius: 20px
├── Used for: primary buttons, focus states
```

### Traditional Shadows

```
BLACK_SMALL:
├── Color: #000000
├── Offset: 0, 2px
├── Opacity: 0.1
├── Radius: 4px
├── Used for: subtle depth on dark backgrounds
```

---

## 🧩 Component Design System

### Button System

#### Primary Button
```tsx
Style: {
  background: #FFF02B (Brand Yellow)
  text: #000000 (Black)
  shadow: YELLOW_GLOW
  transform: UPPERCASE
  font: Aileron-Bold
  radius: 0px (sharp corners)
}

States:
├── Default: Full yellow with black text
├── Pressed: activeOpacity: 0.8
├── Disabled: opacity: 0.5
├── Loading: ActivityIndicator
```

#### Secondary Button
```tsx
Style: {
  background: #2A2A2A (Surface_2)
  text: #FFFFFF (White)
  border: 1px #4D4D4D
  shadow: SMALL
}
```

#### Outline Button
```tsx
Style: {
  background: transparent
  text: #FFF02B (Brand Yellow)
  border: 2px #FFF02B
  shadow: none
}
```

### Card System

#### Standard Card
```tsx
Style: {
  background: CARD_PRIMARY (derived from theme)
  border: 1px #4D4D4D
  radius: 0px (sharp)
  shadow: SMALL
  padding: 16px (configurable)
}

Variants:
├── elevated: MEDIUM shadow
├── glowEffect: YELLOW_GLOW
├── padding: none/sm/md/lg
```

### Navigation System

#### Tab Bar
```tsx
Style: {
  background: #000000 (Black)
  height: Platform-specific
  items: 4 visible tabs
  icons: Ionicons + MaterialIcons
  animation: smooth transitions
  haptics: iOS feedback
}

Active State:
├── icon: #FFF02B (Brand Yellow)
├── text: #FFF02B
├── indicator: Yellow glow

Inactive State:
├── icon: #4D4D4D (Grey)
├── text: #4D4D4D
├── no glow
```

#### Navigation Header
```tsx
Style: {
  background: #121212 (Primary Grey)
  text: #FFFFFF (White)
  font: Aileron-Bold
  icons: #FFF02B (Brand Yellow)
}
```

### Form Elements

#### Input Fields
```tsx
Style: {
  background: #1A1A1A (Surface_1)
  border: 1px #4D4D4D
  radius: 0px
  text: #FFFFFF
  placeholder: #B3B3B3
  focus: border #FFF02B
}
```

#### Dropdowns/Pickers
```tsx
Style: {
  background: #1A1A1A
  border: 1px #4D4D4D
  radius: 0px
  items: #FFFFFF text on #2A2A2A background
  selected: #FFF02B highlight
}
```

---

## 📐 Layout Patterns

### Screen Structure

```
STANDARD SCREEN LAYOUT:
├── Header (navigation bar)
├── Content Area (scrollable)
├── Bottom Tab Bar (if applicable)

SPACING HIERARCHY:
├── Screen edges: 16px padding
├── Section separation: 24px margin
├── Card spacing: 16px margin
├── Element spacing: 12px
```

### Grid Layouts

```
CARD GRID:
├── Columns: 1 (mobile-first)
├── Spacing: 16px between cards
├── Width: Full width minus container padding

LIST LAYOUTS:
├── Item spacing: 12px vertical
├── Dividers: 1px #4D4D4D
├── Padding: 16px horizontal
```

### Modal/Overlay Patterns

```
MODAL STRUCTURE:
├── Backdrop: rgba(0,0,0,0.7)
├── Content: #1A1A1A background
├── Border: 1px #4D4D4D
├── Radius: 0px (consistent)
├── Shadow: LARGE or YELLOW_GLOW
```

---

## 🎬 Animation & Interaction

### Animation Principles

```
DURATION:
├── Micro: 150ms (button press)
├── Short: 250ms (transitions)
├── Medium: 350ms (screen transitions)
├── Long: 500ms (complex animations)

EASING:
├── Standard: Easing.bezier(0.4, 0.0, 0.2, 1)
├── Decelerate: Easing.out(Easing.ease)
├── Accelerate: Easing.in(Easing.ease)
```

### Interactive States

```
BUTTON INTERACTIONS:
├── activeOpacity: 0.8
├── Scale animation on press
├── iOS Haptic feedback

TAB TRANSITIONS:
├── Icon scale animation
├── Color transition
├── Smooth haptic feedback

SCROLL ANIMATIONS:
├── Pull-to-refresh
├── Fade animations
├── Loading state transitions
```

---

## 🔧 Implementation Guidelines

### Theme Configuration

```typescript
// Primary theme file: /src/config/theme.ts
export const COLORS = {
  // Brand Primary Colors
  YELLOW: '#FFF02B',           // Primary accent
  BLACK: '#000000',            // Structural
  GREY_PRIMARY: '#121212',     // Background
  GREY_SECONDARY: '#4D4D4D',   // Content blocks
  
  // Text hierarchy
  TEXT_PRIMARY: '#FFFFFF',     // High contrast
  TEXT_SECONDARY: '#B3B3B3',   // Secondary
  TEXT_MUTED: '#4D4D4D',       // Subtle
  
  // Status colors
  SUCCESS: '#00FF88',
  ERROR: '#FF3366',
  WARNING: '#FFA500',
  INFO: '#FFF02B',
  
  // Surfaces and borders
  SURFACE_1: '#1A1A1A',
  SURFACE_2: '#2A2A2A',
  BORDER: '#4D4D4D',
  BORDER_SUBTLE: '#2A2A2A',
};

export const SPACING = {
  XS: 4,   SM: 8,   MD: 12,
  LG: 16,  XL: 20,  XXL: 24,
};

export const SHADOWS = {
  YELLOW_GLOW: {
    shadowColor: '#FFF02B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  // Additional shadow variants...
};
```

### Component Usage

```tsx
// Button implementation
import { Button } from './components/ui/Button';

<Button 
  title="SUBMIT" 
  variant="primary"     // Yellow background
  size="medium"         // 44px height
  onPress={handleSubmit}
  loading={isLoading}
/>

// Card implementation
import { Card } from './components/ui/Card';

<Card 
  elevated={true}       // Medium shadow
  glowEffect={false}    // No yellow glow
  padding="lg"          // 20px padding
>
  {content}
</Card>
```

---

## 📱 Screen-Specific Patterns

### Home/Dashboard Screen

```
LAYOUT STRUCTURE:
├── Hero section with key metrics
├── Period selector (THIS MONTH, LAST MONTH, THIS YEAR)
├── Net trend chart (visual data representation)
├── Summary cards (Income, Expenses, Net Result)
├── Recent transactions list
├── Quick action buttons

VISUAL HIERARCHY:
├── Large numbers in BebasNeue font
├── Yellow accents on active states
├── Card-based information grouping
├── Consistent 16px spacing
```

### Data Entry Screens

```
FORM STRUCTURE:
├── Clear section headers
├── Input fields with validation states
├── Dropdown selectors with yellow highlights
├── Submit buttons with loading states
├── Error messaging in red (#FF3366)

INTERACTION PATTERNS:
├── Field focus with yellow borders
├── Smooth keyboard handling
├── Validation feedback
├── Success confirmations
```

### Settings/Profile Screens

```
LIST STRUCTURE:
├── Grouped sections with headers
├── Consistent row height (60px)
├── Right-pointing chevrons
├── Toggle switches with yellow active states
├── Clear visual hierarchy
```

---

## 🎯 Brand Application Rules

### For Property Management Applications

#### Color Adaptation
```
PRIMARY: Keep #FFF02B (Brand Yellow) consistent
BACKGROUNDS: Use grey system (#121212, #1A1A1A, #2A2A2A)
ACCENTS: Apply yellow to key actions and highlights
TEXT: Maintain white/grey hierarchy for readability
```

#### Typography Adaptation
```
HEADERS: Use Aileron-Bold for consistency
BODY: Apply Aileron-Regular for readability
NUMBERS: Use BebasNeue for financial data
BRANDING: Use MadeMirage for special elements
```

#### Logo Implementation
```
PLACEMENT: Top-left in navigation
SIZE: Minimum 48px, maximum 128px
COLOR: Always #FFF02B on dark backgrounds
SPACING: Minimum 16px clear space
```

#### Component Styling
```
BUTTONS: Yellow primary, grey secondary
CARDS: Dark backgrounds with subtle borders
NAVIGATION: Black background with yellow accents
FORMS: Dark inputs with yellow focus states
```

---

## 📋 Quality Assurance Checklist

### Brand Consistency Check

```
✅ Logo usage follows protection rules
✅ Yellow (#FFF02B) used consistently for accents
✅ Typography hierarchy maintained
✅ Spacing system (4/8/12/16/20/24) applied
✅ Shadow system used appropriately
✅ Animation timing consistent
✅ Interactive states have yellow highlights
✅ Error states use red (#FF3366)
✅ Success states use green (#00FF88)
✅ Dark theme maintained throughout
```

### Technical Implementation

```
✅ Theme file properly imported
✅ Components use design tokens
✅ Responsive design principles applied
✅ Accessibility standards met
✅ Performance optimized
✅ Cross-platform compatibility
✅ Asset optimization completed
```

---

## 🚀 Recommendations for New Property Management App

### Direct Implementation

1. **Copy Theme System**: Use identical `theme.ts` configuration
2. **Reuse Components**: Implement same Button, Card, Input components
3. **Apply Typography**: Use same font hierarchy and sizing
4. **Maintain Colors**: Keep exact color values for brand consistency
5. **Use Logo System**: Implement same BM monogram with proper sizing

### Customization Guidelines

1. **Screen Layouts**: Adapt component patterns to property-specific content
2. **Icons**: Use same Ionicons/MaterialIcons library for consistency
3. **Navigation**: Apply same tab bar and header styling
4. **Forms**: Use identical input styling for data entry
5. **Charts**: Maintain same visual styling for property analytics

### Brand Extensions

```
PROPERTY-SPECIFIC ADDITIONS:
├── Property status indicators (using brand colors)
├── Tenant information cards (same card styling)
├── Maintenance request forms (same form patterns)
├── Financial reports (same chart styling)
├── Document management (same list patterns)
```

---

## 📞 Support & Resources

### Asset Location
```
FONTS: /assets/fonts/
├── Aileron-Bold.otf
├── Aileron-Regular.otf
├── Aileron-Light.otf
├── BebasNeue-Regular.ttf
└── MadeMirage-Regular.otf

IMAGES: /assets/images/
└── bm-logo.svg

THEME: /src/config/theme.ts
COMPONENTS: /src/components/ui/
```

### Code References

```
BUTTON: /src/components/ui/Button.tsx
CARD: /src/components/ui/Card.tsx
NAVIGATION: /src/components/CustomTabBar.tsx
SCREENS: /src/screens/ (implementation examples)
```

---

## 🎊 Conclusion

The BookMate Mobile Application brand kit represents a sophisticated, modern design system perfectly suited for professional property management applications. The **dark theme with yellow accents** creates a premium, trustworthy appearance that conveys reliability and professionalism.

### Key Brand Pillars:
1. **Consistency**: Unified color palette and typography
2. **Professional**: Dark theme with premium feel
3. **Modern**: Clean, minimalist design approach
4. **Accessible**: High contrast and clear hierarchy
5. **Scalable**: Component-based system for easy implementation

### Implementation Priority:
1. ✅ **Colors & Typography**: Essential for brand recognition
2. ✅ **Logo System**: Critical for brand identity
3. ✅ **Component Library**: Ensures UI consistency
4. ✅ **Layout Patterns**: Maintains user experience consistency
5. ✅ **Animation System**: Provides professional polish

By following this brand kit, all Sia Moon property management applications will maintain visual consistency, professional appearance, and user experience continuity across the entire business ecosystem.

---

**Report Prepared by**: Mobile Development Team  
**For**: Sia Moon Co., Ltd. Property Management Applications  
**Next Steps**: Implement brand kit in new property management application  
**Timeline**: Ready for immediate implementation

---

**📧 Contact**: Mobile Development Team  
**📅 Last Updated**: January 4, 2026  
**📄 Document Version**: 1.0.0
