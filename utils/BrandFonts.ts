/**
 * Brand Kit Font Registration
 * Registers all fonts from the BookMate brand kit for Sia Moon Property Management
 */

import * as Font from 'expo-font';

export const loadBrandFonts = async () => {
  try {
    console.log('🎨 Loading Brand Kit fonts...');
    
    await Font.loadAsync({
      // Aileron Font Family (Primary Brand Fonts)
      'Aileron-Bold': require('../assets/fonts/Aileron-Bold.otf'),
      'Aileron-Regular': require('../assets/fonts/Aileron-Regular.otf'),
      'Aileron-Light': require('../assets/fonts/Aileron-Light.otf'),
      
      // BebasNeue (Display Numbers)
      'BebasNeue-Regular': require('../assets/fonts/BebasNeue-Regular.ttf'),
      
      // MadeMirage (Accent/Branding)
      'MadeMirage-Regular': require('../assets/fonts/MadeMirage-Regular.otf'),
    });
    
    console.log('✅ Brand fonts loaded');
    return true;
  } catch (error) {
    console.error('❌ Error loading brand fonts:', error);
    console.warn('⚠️ Falling back to system fonts');
    return false;
  }
};

// Font mapping helper
export const getBrandFont = (fontType: 'primary' | 'regular' | 'light' | 'display' | 'accent') => {
  // Return brand fonts if loaded, otherwise fall back to system fonts
  const fontMap = {
    primary: 'Aileron-Bold',      // Headers, buttons, emphasis
    regular: 'Aileron-Regular',   // Body text, general content
    light: 'Aileron-Light',       // Subtle text, secondary info
    display: 'BebasNeue-Regular', // Large numbers, statistics
    accent: 'MadeMirage-Regular', // Special headings, branding
  };

  // Check if fonts are loaded, return system font if not
  if (!areBrandFontsLoaded()) {
    console.warn(`⚠️ Brand font ${fontMap[fontType]} not loaded, using System font`);
    return 'System';
  }

  return fontMap[fontType];
};

// Check if fonts are available
export const areBrandFontsLoaded = () => {
  try {
    return Font.isLoaded('Aileron-Bold') && 
           Font.isLoaded('Aileron-Regular') && 
           Font.isLoaded('Aileron-Light') &&
           Font.isLoaded('BebasNeue-Regular') &&
           Font.isLoaded('MadeMirage-Regular');
  } catch {
    return false;
  }
};

export default {
  loadBrandFonts,
  getBrandFont,
  areBrandFontsLoaded,
};
