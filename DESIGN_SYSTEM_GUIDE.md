# 🎨 Mobile App Design System

This document outlines the complete design system for the Property Management mobile app. **ALL new components, pages, tabs, popups, and modals MUST follow these guidelines** to maintain visual consistency.

## 📋 Quick Reference

### Import the Design System
```typescript
import { colors, gradients, typography, componentStyles, patterns } from '@/utils/designSystem';
```

### Use Component Templates
```typescript
import { MODAL_TEMPLATE, TAB_SCREEN_TEMPLATE } from '@/utils/componentTemplates';
```

## 🎯 Core Design Principles

### 1. **Always Use Dark Theme**
- Primary background: `#0B0F1A`
- Card backgrounds: `#1A1F2E`
- Elevated elements: `#252A3A`

### 2. **Consistent Accent Colors**
- Primary accent: `#C6FF00` (neon green)
- Secondary accent: `#00E5FF` (cyan)
- Status colors: success, warning, error defined in system

### 3. **LinearGradient Backgrounds**
- Use `gradients.primary` for main backgrounds
- Use `gradients.secondary` for cards
- Use `gradients.accent` for buttons and highlights

### 4. **Ionicons Only**
- Consistent icon family across the app
- Use `iconSizes` constants for sizing
- Color icons with theme colors

## 🏗️ Component Structure Standards

### Modal Components
```typescript
<Portal>
  <Modal contentContainerStyle={patterns.createModalStyles().container}>
    <LinearGradient colors={gradients.primary}>
      <SafeAreaView>
        <ScrollView>
          {/* Header with icon, title, close button */}
          {/* Content */}
          {/* Action buttons */}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  </Modal>
</Portal>
```

### Tab Screens
```typescript
<SafeAreaView style={componentStyles.screenContainer}>
  <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
  <LinearGradient colors={gradients.primary} style={headerStyles}>
    {/* Header content */}
  </LinearGradient>
  <ScrollView refreshControl={RefreshControl}>
    {/* Content */}
  </ScrollView>
</SafeAreaView>
```

### Cards
```typescript
<View style={componentStyles.card}>
  {/* Card content */}
</View>
```

## 🎨 Color Usage Guide

### Backgrounds
- **Screens**: `colors.primary` (#0B0F1A)
- **Cards/Modals**: `colors.secondary` (#1A1F2E)
- **Elevated Elements**: `colors.tertiary` (#252A3A)
- **Buttons Primary**: `colors.accent` (#C6FF00)
- **Buttons Secondary**: `colors.buttonSecondary` (#2A3A4A)

### Text
- **Primary Text**: `colors.textPrimary` (#FFFFFF)
- **Secondary Text**: `colors.textSecondary` (#C1C9D6)
- **Muted Text**: `colors.textMuted` (#8A92A6)
- **Disabled Text**: `colors.textDisabled` (#5A6B7A)

### Borders
- **Subtle Borders**: `colors.border` (#2A3A4A)
- **Accent Borders**: `colors.borderAccent` (#C6FF00)

## 📝 Typography Standards

### Headers
- **Large Title**: `typography.h1` (32px, weight 700)
- **Title**: `typography.h2` (28px, weight 700)
- **Section Header**: `typography.h3` (24px, weight 600)
- **Card Title**: `typography.h4` (20px, weight 600)
- **Subtitle**: `typography.h5` (18px, weight 600)
- **Label**: `typography.h6` (16px, weight 600)

### Body Text
- **Primary Body**: `typography.body1` (16px, line-height 24)
- **Secondary Body**: `typography.body2` (14px, line-height 20)
- **Label Text**: `typography.label` (14px, weight 500)
- **Caption**: `typography.caption` (12px, weight 500)

### Buttons
- **Primary Button**: `typography.buttonPrimary` (16px, weight 600, dark text)
- **Secondary Button**: `typography.buttonSecondary` (16px, weight 500, light text)

## 🔧 Common Patterns

### Modal Creation
```typescript
const styles = patterns.createModalStyles({
  // Optional overrides
  container: { margin: 30 },
});
```

### Button Rows
```typescript
const buttonStyles = patterns.createButtonRowStyles({
  // Optional overrides
  container: { marginTop: 20 },
});
```

### Status Bar
```typescript
<StatusBar barStyle="light-content" backgroundColor={colors.primary} />
```

### Loading States
```typescript
{loading ? (
  <ActivityIndicator size="small" color={colors.primary} />
) : (
  <Text>Button Text</Text>
)}
```

## 🚫 What NOT to Use

### ❌ Avoid These
- Tailwind classes (`bg-white`, `text-gray-500`, etc.)
- Hardcoded hex colors (`#ffffff`, `#000000`)
- FontAwesome icons (use Ionicons)
- Material icons (use Ionicons)
- White backgrounds
- Light theme colors
- Inconsistent spacing values
- Random border radius values

### ✅ Use These Instead
- Design system colors (`colors.primary`, `colors.accent`)
- Design system typography (`typography.h1`, `typography.body1`)
- Ionicons (`<Ionicons name="icon-name" />`)
- Design system spacing (`spacing.lg`, `spacing.xl`)
- Design system border radius (`borderRadius.lg`, `borderRadius.md`)

## 📱 Component Examples

### Example Modal
```typescript
import { colors, gradients, patterns } from '@/utils/designSystem';

const YourModal = ({ visible, onDismiss }) => {
  const styles = patterns.createModalStyles();
  
  return (
    <Portal>
      <Modal visible={visible} contentContainerStyle={styles.container}>
        <LinearGradient colors={gradients.primary} style={styles.gradient}>
          {/* Content */}
        </LinearGradient>
      </Modal>
    </Portal>
  );
};
```

### Example Tab Screen
```typescript
import { colors, componentStyles, typography } from '@/utils/designSystem';

const YourScreen = () => (
  <SafeAreaView style={componentStyles.screenContainer}>
    <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
    {/* Content */}
  </SafeAreaView>
);
```

## ✅ Pre-Flight Checklist

Before creating any new component, ensure:

1. **Imported design system**: `import { ... } from '@/utils/designSystem'`
2. **No Tailwind classes**: Search and replace any `className=` with `style=`
3. **Dark theme colors**: All backgrounds are dark, text is light
4. **Ionicons used**: No other icon libraries
5. **LinearGradient backgrounds**: For elevated surfaces
6. **Consistent spacing**: Using `spacing.xs` through `spacing.massive`
7. **Typography system**: Using `typography.h1` through `typography.caption`
8. **Status bar configured**: `barStyle="light-content"`
9. **SafeAreaView wrapper**: For screen-level components
10. **Component patterns**: Using `patterns.createModalStyles()` etc.

## 🔄 Migration Guide

When updating existing components:

1. Replace Tailwind classes with design system styles
2. Replace hardcoded colors with design system colors
3. Replace FontAwesome/Material icons with Ionicons
4. Add LinearGradient backgrounds
5. Update typography to use design system
6. Ensure proper spacing using design system values
7. Test on device to verify dark theme appearance

---

**Remember**: Consistency is key! Every new component should look and feel like it belongs in the same app. Use this design system religiously to avoid future refactoring work.
