/**
 * App Logo Configuration
 * Centralized logo URLs from Cloudinary
 */

import { cloudinaryService } from '../services/cloudinaryService';

/**
 * Main app logo URLs optimized for different use cases
 */
export const AppLogo = {
  // Main app icon (1024x1024) - for app stores
  appIcon: cloudinaryService.generateOptimizedUrl('logo-white-vector-3svg_dmz2pf', {
    width: 1024,
    height: 1024,
    format: 'png',
    quality: 'auto',
    crop: 'fill',
  }),
  
  // Adaptive icon (Android - 1024x1024)
  adaptiveIcon: cloudinaryService.generateOptimizedUrl('logo-white-vector-3svg_dmz2pf', {
    width: 1024,
    height: 1024,
    format: 'png',
    quality: 'auto',
    crop: 'fill',
  }),
  
  // Favicon (32x32)
  favicon: cloudinaryService.generateOptimizedUrl('logo-white-vector-3svg_dmz2pf', {
    width: 32,
    height: 32,
    format: 'png',
    quality: 'auto',
    crop: 'fill',
  }),
  
  // Large favicon (192x192)
  faviconLarge: cloudinaryService.generateOptimizedUrl('logo-white-vector-3svg_dmz2pf', {
    width: 192,
    height: 192,
    format: 'png',
    quality: 'auto',
    crop: 'fill',
  }),
  
  // Splash screen (600x600)
  splash: cloudinaryService.generateOptimizedUrl('logo-white-vector-3svg_dmz2pf', {
    width: 600,
    height: 600,
    format: 'png',
    quality: 'auto',
    crop: 'fill',
  }),
  
  // Navigation/Header logo (optimized for horizontal space)
  header: cloudinaryService.generateOptimizedUrl('logo-white-vector-3svg_dmz2pf', {
    width: 200,
    height: 60,
    format: 'auto',
    quality: 'auto',
    crop: 'fit',
  }),
  
  // Small logo for notifications
  notification: cloudinaryService.generateOptimizedUrl('logo-white-vector-3svg_dmz2pf', {
    width: 64,
    height: 64,
    format: 'png',
    quality: 'auto',
    crop: 'fill',
  }),
  
  // Original SVG (no transformations - best quality)
  original: `https://res.cloudinary.com/doez7m1hy/image/upload/logo-white-vector-3svg_dmz2pf`,
  
  // Responsive logo function for different screen sizes
  responsive: (width: number, height: number, format: 'png' | 'webp' | 'auto' = 'auto') => {
    return cloudinaryService.generateOptimizedUrl('logo-white-vector-3svg_dmz2pf', {
      width,
      height,
      format,
      quality: 'auto',
      crop: 'fit',
    });
  },
};

/**
 * Logo component props for easy usage
 */
export const LogoProps = {
  // For main app icon/splash
  appIcon: {
    source: { uri: AppLogo.appIcon },
    style: { width: 120, height: 120 },
    resizeMode: 'contain' as const,
  },
  
  // For header/navigation
  header: {
    source: { uri: AppLogo.header },
    style: { width: 150, height: 40 },
    resizeMode: 'contain' as const,
  },
  
  // For notifications
  notification: {
    source: { uri: AppLogo.notification },
    style: { width: 32, height: 32 },
    resizeMode: 'contain' as const,
  },
  
  // For small inline usage
  small: {
    source: { uri: AppLogo.responsive(40, 40) },
    style: { width: 40, height: 40 },
    resizeMode: 'contain' as const,
  },
  
  // For medium usage
  medium: {
    source: { uri: AppLogo.responsive(80, 80) },
    style: { width: 80, height: 80 },
    resizeMode: 'contain' as const,
  },
  
  // For large usage
  large: {
    source: { uri: AppLogo.responsive(160, 160) },
    style: { width: 160, height: 160 },
    resizeMode: 'contain' as const,
  },
};

export default AppLogo;
