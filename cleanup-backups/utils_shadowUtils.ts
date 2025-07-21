/**
 * Shadow Utilities
 * Converts React Native shadow props to web-compatible boxShadow
 */

import { Platform } from 'react-native';

export interface ShadowProps {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

export interface WebShadowStyle {
  boxShadow?: string;
  elevation?: number;
}

/**
 * Convert React Native shadow props to web-compatible style
 */
export function createShadow(props: ShadowProps): ShadowProps | WebShadowStyle {
  if (Platform.OS === 'web') {
    const {
      shadowColor = '#000',
      shadowOffset = { width: 0, height: 2 },
      shadowOpacity = 0.25,
      shadowRadius = 4,
      elevation
    } = props;

    // Convert to rgba if needed
    const color = shadowColor.startsWith('#') 
      ? hexToRgba(shadowColor, shadowOpacity)
      : shadowColor;

    const boxShadow = `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px ${color}`;

    return {
      boxShadow,
      elevation
    };
  }

  // Return original props for native platforms
  return props;
}

/**
 * Convert hex color to rgba with opacity
 */
function hexToRgba(hex: string, opacity: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0, 0, 0, ${opacity})`;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Predefined shadow styles
 */
export const shadowStyles = {
  small: createShadow({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  }),
  medium: createShadow({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  }),
  large: createShadow({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }),
  accent: createShadow({
    shadowColor: '#C6FF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }),
};
