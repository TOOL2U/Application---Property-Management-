/**
 * App Logo Component
 * A reusable logo component that automatically uses Cloudinary URLs
 */

import React from 'react';
import { Image, ImageProps, StyleProp, ImageStyle } from 'react-native';
import { AppLogo } from '../../constants/AppLogo';

interface LogoComponentProps {
  /**
   * Logo size preset
   */
  size?: 'small' | 'medium' | 'large' | 'header' | 'notification' | 'appIcon';
  
  /**
   * Custom width (overrides size preset)
   */
  width?: number;
  
  /**
   * Custom height (overrides size preset)
   */
  height?: number;
  
  /**
   * Image format optimization
   */
  format?: 'png' | 'webp' | 'auto';
  
  /**
   * Custom style
   */
  style?: StyleProp<ImageStyle>;
  
  /**
   * Additional Image props
   */
  imageProps?: Omit<ImageProps, 'source' | 'style'>;
  
  /**
   * Tint color (for monochrome logos)
   */
  tintColor?: string;
  
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
}

/**
 * Logo Component
 * Automatically fetches optimized logo from Cloudinary
 */
export const Logo: React.FC<LogoComponentProps> = ({
  size = 'medium',
  width,
  height,
  format = 'auto',
  style,
  imageProps,
  tintColor,
  accessibilityLabel = 'Sia Moon Property Management Logo',
}) => {
  // Determine dimensions based on size preset or custom values
  const getDimensions = () => {
    if (width && height) {
      return { width, height };
    }
    
    switch (size) {
      case 'small':
        return { width: 40, height: 40 };
      case 'medium':
        return { width: 80, height: 80 };
      case 'large':
        return { width: 160, height: 160 };
      case 'header':
        return { width: 150, height: 40 };
      case 'notification':
        return { width: 32, height: 32 };
      case 'appIcon':
        return { width: 120, height: 120 };
      default:
        return { width: 80, height: 80 };
    }
  };
  
  const dimensions = getDimensions();
  
  // Get optimized logo URL
  const getLogoUrl = () => {
    if (size === 'appIcon') {
      return AppLogo.appIcon;
    }
    if (size === 'header') {
      return AppLogo.header;
    }
    if (size === 'notification') {
      return AppLogo.notification;
    }
    
    // For custom sizes or other presets, use responsive function
    return AppLogo.responsive(dimensions.width, dimensions.height, format);
  };
  
  return (
    <Image
      source={{ uri: getLogoUrl() }}
      style={[
        {
          width: dimensions.width,
          height: dimensions.height,
        },
        style,
      ]}
      tintColor={tintColor}
      resizeMode="contain"
      accessibilityLabel={accessibilityLabel}
      {...imageProps}
    />
  );
};

export default Logo;
