/**
 * React Hook for Internationalization
 * Now uses the TranslationContext for better state management
 */

import { useTranslationContext } from '../contexts/TranslationContext';

export const useTranslation = () => {
  return useTranslationContext();
};

export default useTranslation;
