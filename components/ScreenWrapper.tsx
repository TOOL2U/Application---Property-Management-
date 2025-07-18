import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PersistentNotificationIcon } from './notifications/PersistentNotificationIcon';

interface ScreenWrapperProps {
  children: React.ReactNode;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={styles.container}>
      {children}
      <PersistentNotificationIcon 
        style={{
          position: 'absolute',
          top: insets.top + 10,
          right: 16,
          zIndex: 1000,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});

export default ScreenWrapper;
