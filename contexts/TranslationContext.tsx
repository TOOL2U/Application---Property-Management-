/**
 * Translation Context
 * Provides translation state to all components and forces re-renders on language change
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import i18nService, { SupportedLanguage } from '../services/i18nService';

interface TranslationContextType {
  // Translation function
  t: (key: string, options?: any) => string;
  
  // Language management
  currentLanguage: string;
  currentLanguageInfo: SupportedLanguage | undefined;
  supportedLanguages: SupportedLanguage[];
  changeLanguage: (languageCode: string) => Promise<void>;
  isLoading: boolean;
  
  // Formatting functions
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  
  // Utility functions
  isRTL: boolean;
  deviceLanguage: string;
  
  // Force re-render trigger
  forceUpdate: () => void;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18nService.getCurrentLanguage());
  const [isLoading, setIsLoading] = useState(false);
  const [updateCounter, setUpdateCounter] = useState(0);

  useEffect(() => {
    console.log('🌍 TranslationProvider: Setting up language change listener');
    
    // Subscribe to language changes
    const unsubscribe = i18nService.onLanguageChange((newLanguage) => {
      console.log('🌍 Language changed to:', newLanguage);
      setCurrentLanguage(newLanguage);
      setUpdateCounter(prev => prev + 1);
    });

    return unsubscribe;
  }, []);

  const changeLanguage = async (languageCode: string) => {
    console.log('🌍 TranslationProvider: Changing language to:', languageCode);
    setIsLoading(true);
    try {
      await i18nService.setLanguage(languageCode);
    } catch (error) {
      console.error('❌ Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const forceUpdate = () => {
    setUpdateCounter(prev => prev + 1);
  };

  const contextValue: TranslationContextType = {
    // Translation function
    t: i18nService.translate,
    
    // Language management
    currentLanguage,
    currentLanguageInfo: i18nService.getCurrentLanguageInfo(),
    supportedLanguages: i18nService.getSupportedLanguages(),
    changeLanguage,
    isLoading,
    
    // Formatting functions
    formatNumber: i18nService.formatNumber.bind(i18nService),
    formatDate: i18nService.formatDate.bind(i18nService),
    formatCurrency: i18nService.formatCurrency.bind(i18nService),
    
    // Utility functions
    isRTL: i18nService.isRTL(),
    deviceLanguage: i18nService.getDeviceLanguage(),
    
    // Force re-render trigger
    forceUpdate,
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationContext = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslationContext must be used within a TranslationProvider');
  }
  return context;
};

export default TranslationProvider;
