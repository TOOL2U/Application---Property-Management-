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



export default AppLogo;
