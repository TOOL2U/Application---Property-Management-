/**
 * Internationalization Service
 * Handles multiple language support using react-native-localize and i18n-js
 */

import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Handle web environment where react-native-localize is not available
let RNLocalize: any;
try {
  RNLocalize = require('react-native-localize');
} catch (error) {
  // Fallback for web environment
  RNLocalize = {
    getLocales: () => [{ countryCode: 'US', languageTag: 'en-US', languageCode: 'en', isRTL: false }],
    findBestLanguageTag: () => ({ languageTag: 'en-US', isRTL: false }),
    addEventListener: () => () => {},
    removeEventListener: () => {},
  };
}

// Import language files
import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import my from '../locales/my.json';
import th from '../locales/th.json';

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ', flag: '🇲🇲' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
];

const LANGUAGE_STORAGE_KEY = '@property_management_language';

class InternationalizationService {
  private i18n: I18n;
  private currentLanguage: string = 'en';
  private changeListeners: ((language: string) => void)[] = [];

  constructor() {
    this.i18n = new I18n();
    this.setupI18n();
    this.initializeLanguage();
  }

  private setupI18n() {
    // Configure translations
    this.i18n.store({
      en,
      es,
      fr,
      my,
      th,
    });

    // Set fallback language
    this.i18n.defaultLocale = 'en';
    this.i18n.enableFallback = true;
    this.i18n.missingBehavior = 'guess'; // Show key if missing

    // Configure pluralization (optional - for complex language rules)
    // Note: Pluralization functions take (i18n, count) as parameters
  }
  
  /**
   * Force reload translations (useful after updating locale files)
   */
  reloadTranslations() {
    console.log('🔄 Reloading translations...');
    this.setupI18n();
    this.i18n.locale = this.currentLanguage;
    this.changeListeners.forEach(listener => listener(this.currentLanguage));
    console.log('✅ Translations reloaded');
  }

  private async initializeLanguage() {
    try {
      // Try to get saved language preference
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      
      if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
        this.setLanguage(savedLanguage);
        return;
      }

      // Detect device language
      const deviceLanguages = RNLocalize.getLocales();
      const deviceLanguage = deviceLanguages[0]?.languageCode;

      if (deviceLanguage && this.isLanguageSupported(deviceLanguage)) {
        this.setLanguage(deviceLanguage);
      } else {
        // Fallback to English
        this.setLanguage('en');
      }
    } catch (error) {
      console.error('❌ Failed to initialize language:', error);
      this.setLanguage('en');
    }
  }

  private isLanguageSupported(languageCode: string): boolean {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
  }

  /**
   * Translate a key to the current language
   */
  translate = (key: string, options?: any): string => {
    try {
      return this.i18n.t(key, { ...options, locale: this.currentLanguage });
    } catch (error) {
      console.warn('⚠️ Translation missing for key:', key);
      return key;
    }
  };

  /**
   * Shorthand for translate
   */
  t = this.translate;

  /**
   * Get current language code
   */
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Get current language info
   */
  getCurrentLanguageInfo(): SupportedLanguage | undefined {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === this.currentLanguage);
  }

  /**
   * Set language and persist to storage
   */
  async setLanguage(languageCode: string): Promise<void> {
    if (!this.isLanguageSupported(languageCode)) {
      console.warn('⚠️ Unsupported language:', languageCode);
      return;
    }

    try {
      this.currentLanguage = languageCode;
      this.i18n.locale = languageCode;
      
      // Persist to storage
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      
      // Notify listeners
      this.changeListeners.forEach(listener => listener(languageCode));
      
      console.log('✅ Language changed to:', languageCode);
    } catch (error) {
      console.error('❌ Failed to set language:', error);
    }
  }

  /**
   * Get available languages
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Subscribe to language changes
   */
  onLanguageChange(callback: (language: string) => void): () => void {
    this.changeListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.changeListeners = this.changeListeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Format numbers according to current locale
   */
  formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    try {
      const locale = this.getLocaleString();
      return new Intl.NumberFormat(locale, options).format(number);
    } catch (error) {
      return number.toString();
    }
  }

  /**
   * Format dates according to current locale
   */
  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    try {
      const locale = this.getLocaleString();
      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
      return date.toLocaleDateString();
    }
  }

  /**
   * Format currency according to current locale
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    try {
      const locale = this.getLocaleString();
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount}`;
    }
  }

  private getLocaleString(): string {
    const localeMap: { [key: string]: string } = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
    };
    
    return localeMap[this.currentLanguage] || 'en-US';
  }

  /**
   * Check if current language is RTL (Right-to-Left)
   */
  isRTL(): boolean {
    // Add RTL languages here if needed (Arabic, Hebrew, etc.)
    const rtlLanguages = ['ar', 'he', 'fa'];
    return rtlLanguages.includes(this.currentLanguage);
  }

  /**
   * Get device language
   */
  getDeviceLanguage(): string {
    const deviceLanguages = RNLocalize.getLocales();
    return deviceLanguages[0]?.languageCode || 'en';
  }

  /**
   * Interpolate variables in translation strings
   */
  translateWithVariables(key: string, variables: { [key: string]: any }): string {
    return this.translate(key, variables);
  }
}

// Create singleton instance
export const i18nService = new InternationalizationService();

// Export commonly used functions
export const t = i18nService.translate;
export const setLanguage = i18nService.setLanguage.bind(i18nService);
export const getCurrentLanguage = i18nService.getCurrentLanguage.bind(i18nService);
export const getSupportedLanguages = i18nService.getSupportedLanguages.bind(i18nService);

export default i18nService;
