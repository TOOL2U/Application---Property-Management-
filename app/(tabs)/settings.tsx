import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePINAuth } from "@/contexts/PINAuthContext";
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from '@/hooks/useTranslation';
import { BrandTheme } from '@/constants/BrandTheme';
import { Card } from '@/components/ui/BrandCard';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  color?: string;
  destructive?: boolean;
}

export default function BrandSettingsScreen() {
  const { currentProfile, logout } = usePINAuth();
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const router = useRouter();
  
  // App settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationTrackingEnabled, setLocationTrackingEnabled] = useState(true);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 [Settings]: Screen focused, refreshing settings...');
      // Settings are mostly local state, but this ensures fresh render
    }, [])
  );

  // Pull-to-refresh handler
  const onRefresh = React.useCallback(async () => {
    console.log('🔄 [Settings]: Manual refresh triggered');
    setRefreshing(true);
    // Simulate settings refresh (could reload user preferences from Firestore)
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ [Settings]: Refresh complete');
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      t('settings.logout_confirm_title'),
      t('settings.logout_confirm_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/select-profile');
            } catch (error) {
              console.error('Logout failed:', error);
              Alert.alert(
                t('settings.logout_error_title'),
                t('settings.logout_error_message'),
                [{ text: t('common.ok'), style: 'default' }]
              );
            }
          },
        },
      ]
    );
  };

  const settingsSections: { title: string; items: SettingItem[] }[] = [
    {
      title: t('settings.app_preferences'),
      items: [
        {
          id: 'notifications',
          title: t('settings.notifications'),
          subtitle: t('settings.notifications_subtitle'),
          icon: 'notifications-outline',
          type: 'toggle',
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
        {
          id: 'location',
          title: t('settings.location_tracking'),
          subtitle: t('settings.location_subtitle'),
          icon: 'location-outline',
          type: 'toggle',
          value: locationTrackingEnabled,
          onToggle: setLocationTrackingEnabled,
        },
        {
          id: 'auto_refresh',
          title: t('settings.auto_refresh'),
          subtitle: t('settings.auto_refresh_subtitle'),
          icon: 'refresh-outline',
          type: 'toggle',
          value: autoRefreshEnabled,
          onToggle: setAutoRefreshEnabled,
        },
        {
          id: 'language',
          title: t('settings.language'),
          subtitle: currentLanguage === 'en' ? 'English' : 'ภาษาไทย',
          icon: 'language-outline',
          type: 'navigation',
          onPress: () => {
            Alert.alert(
              t('settings.language'),
              t('settings.select_language'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                { text: 'English', onPress: () => changeLanguage('en') },
                { text: 'ภาษาไทย', onPress: () => changeLanguage('th') },
              ]
            );
          },
        },
      ],
    },
    {
      title: t('settings.data_sync'),
      items: [
        {
          id: 'sync_jobs',
          title: t('settings.sync_jobs'),
          subtitle: t('settings.sync_jobs_subtitle'),
          icon: 'sync-outline',
          type: 'action',
          onPress: () => {
            Alert.alert(
              t('settings.sync_started'),
              t('settings.sync_started_message')
            );
          },
        },
        {
          id: 'clear_cache',
          title: t('settings.clear_cache'),
          subtitle: t('settings.clear_cache_subtitle'),
          icon: 'trash-outline',
          type: 'action',
          onPress: () => {
            Alert.alert(
              t('settings.clear_cache_confirm_title'),
              t('settings.clear_cache_confirm_message'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('common.confirm'),
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert(t('settings.cache_cleared'));
                  },
                },
              ]
            );
          },
        },
      ],
    },
    {
      title: t('settings.help_support'),
      items: [
        {
          id: 'help',
          title: t('settings.help_center'),
          subtitle: t('settings.help_subtitle'),
          icon: 'help-circle-outline',
          type: 'navigation',
          onPress: () => {
            Linking.openURL('https://help.siamoon.com');
          },
        },
        {
          id: 'contact',
          title: t('settings.contact_support'),
          subtitle: t('settings.contact_subtitle'),
          icon: 'mail-outline',
          type: 'navigation',
          onPress: () => {
            Linking.openURL('mailto:support@siamoon.com');
          },
        },
        {
          id: 'about',
          title: t('settings.about'),
          subtitle: t('settings.version', { version: '2.1.0' }),
          icon: 'information-circle-outline',
          type: 'navigation',
          onPress: () => {
            Alert.alert(
              t('settings.about'),
              t('settings.app_info')
            );
          },
        },
      ],
    },
    {
      title: t('settings.account'),
      items: [
        {
          id: 'logout',
          title: t('settings.logout'),
          subtitle: t('settings.logout_subtitle'),
          icon: 'log-out-outline',
          type: 'action',
          destructive: true,
          onPress: handleLogout,
          color: BrandTheme.colors.ERROR,
        },
      ],
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={item.onPress}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.settingIconContainer}>
          <Ionicons
            name={item.icon}
            size={22}
            color={item.destructive ? BrandTheme.colors.ERROR : BrandTheme.colors.YELLOW}
          />
        </View>
        
        <View style={styles.settingContent}>
          <Text style={[
            styles.settingTitle,
            item.destructive && { color: BrandTheme.colors.ERROR }
          ]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>
              {item.subtitle}
            </Text>
          )}
        </View>
        
        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{
              false: BrandTheme.colors.BORDER_SUBTLE,
              true: BrandTheme.colors.YELLOW + '40',
            }}
            thumbColor={item.value ? BrandTheme.colors.YELLOW : BrandTheme.colors.GREY_SECONDARY}
          />
        )}
        
        {item.type === 'navigation' && (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={BrandTheme.colors.GREY_SECONDARY}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BrandTheme.colors.BLACK} />
      
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('settings.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('settings.manage_preferences')}</Text>
        </View>
      </View>

      {/* Profile Card */}
      {currentProfile && (
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {currentProfile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{currentProfile.name}</Text>
              <Text style={styles.profileRole}>{currentProfile.role}</Text>
              <Text style={styles.profileEmail}>{currentProfile.email}</Text>
            </View>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={() => router.push('/(tabs)/profile-brand')}
            >
              <Ionicons name="create-outline" size={20} color={BrandTheme.colors.YELLOW} />
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Settings List */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BrandTheme.colors.YELLOW}
            colors={[BrandTheme.colors.YELLOW]}
            progressBackgroundColor={BrandTheme.colors.SURFACE_1}
          />
        }
      >
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <View key={item.id}>
                  {renderSettingItem(item)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))}
            </Card>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: BrandTheme.colors.GREY_PRIMARY,
  },

  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    paddingHorizontal: BrandTheme.spacing.LG,
    paddingVertical: BrandTheme.spacing.MD,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.colors.BORDER_SUBTLE,
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: BrandTheme.colors.TEXT_PRIMARY,
  },

  headerSubtitle: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    marginTop: BrandTheme.spacing.XS,
  },

  profileCard: {
    marginHorizontal: BrandTheme.spacing.LG,
    marginVertical: BrandTheme.spacing.MD,
  },

  profileHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: BrandTheme.colors.YELLOW,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  profileAvatarText: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: BrandTheme.colors.BLACK,
  },

  profileInfo: {
    flex: 1,
    marginLeft: BrandTheme.spacing.MD,
  },

  profileName: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: BrandTheme.colors.TEXT_PRIMARY,
  },

  profileRole: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    textTransform: 'capitalize' as const,
  },

  profileEmail: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 12,
    color: BrandTheme.colors.TEXT_SECONDARY,
  },

  editProfileButton: {
    padding: BrandTheme.spacing.SM,
  },

  scrollView: {
    flex: 1,
    paddingHorizontal: BrandTheme.spacing.LG,
  },

  section: {
    marginBottom: BrandTheme.spacing.LG,
  },

  sectionTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: BrandTheme.colors.TEXT_SECONDARY,
    marginBottom: BrandTheme.spacing.SM,
    marginLeft: BrandTheme.spacing.XS,
  },

  sectionCard: {
    paddingVertical: BrandTheme.spacing.XS,
  },

  settingItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: BrandTheme.spacing.MD,
    paddingHorizontal: BrandTheme.spacing.LG,
  },

  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BrandTheme.colors.BLACK + '10',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: BrandTheme.spacing.MD,
  },

  settingContent: {
    flex: 1,
  },

  settingTitle: {
    fontFamily: BrandTheme.typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: '600' as const,
    color: BrandTheme.colors.TEXT_PRIMARY,
  },

  settingSubtitle: {
    fontFamily: BrandTheme.typography.fontFamily.regular,
    fontSize: 14,
    color: BrandTheme.colors.TEXT_SECONDARY,
    marginTop: 2,
  },

  separator: {
    height: 1,
    backgroundColor: BrandTheme.colors.BORDER_SUBTLE,
    marginLeft: 56,
  },
};
