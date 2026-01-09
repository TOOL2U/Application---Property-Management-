/**
 * Screen Wrapper with Notification Icon
 * Wraps screens to add the persistent notification icon
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PersistentNotificationIcon } from './PersistentNotificationIcon';
import { NotificationModal } from './NotificationModal';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  hideNotificationIcon?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ 
  children, 
  style,
  hideNotificationIcon = false 
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[{ flex: 1 }, style]}>
      {children}
      
      {/* Persistent Notification Icon */}
      {!hideNotificationIcon && (
        <PersistentNotificationIcon
          style={{
            position: 'absolute',
            top: insets.top + 16,
            right: 16,
            zIndex: 1000,
          }}
        />
      )}
      
      {/* Notification Modal */}
      <NotificationModal />
    </View>
  );
};
