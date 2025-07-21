# 🎯 Design System Quick Start

## 📥 Import First
```typescript
import { colors, gradients, typography, componentStyles, patterns } from '@/utils/designSystem';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
```

## 🎨 Essential Colors
```typescript
colors.primary      // #0B0F1A - Main background
colors.secondary    // #1A1F2E - Cards, modals
colors.accent       // #C6FF00 - Primary accent
colors.textPrimary  // #FFFFFF - Main text
colors.textMuted    // #8A92A6 - Secondary text
```

## 🚀 Quick Templates

### Modal
```typescript
const styles = patterns.createModalStyles();
return (
  <Portal>
    <Modal visible={visible} contentContainerStyle={styles.container}>
      <LinearGradient colors={gradients.primary} style={styles.gradient}>
        <SafeAreaView style={styles.gradient}>
          {/* Content */}
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  </Portal>
);
```

### Screen
```typescript
<SafeAreaView style={componentStyles.screenContainer}>
  <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
  <LinearGradient colors={gradients.primary}>
    {/* Content */}
  </LinearGradient>
</SafeAreaView>
```

### Card
```typescript
<View style={componentStyles.card}>
  {/* Content */}
</View>
```

## ✅ Checklist
- [ ] Dark theme colors only
- [ ] Ionicons for all icons
- [ ] LinearGradient backgrounds
- [ ] Design system typography
- [ ] SafeAreaView + StatusBar
- [ ] No Tailwind classes
- [ ] No hardcoded colors

## 🔗 Full Documentation
See `DESIGN_SYSTEM_GUIDE.md` for complete details.
