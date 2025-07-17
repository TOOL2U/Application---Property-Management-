import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '@/contexts/AuthContext';
import { useJobNotifications } from '@/hooks/useJobNotifications';
import {
  User,
  Bell,
  MapPin,
  Settings,
  Phone,
  Mail,
  Shield,
  ChevronRight,
  TrendingUp,
  Award,
  Clock,
  Star,
  Wrench,
  CheckCircle,
} from 'lucide-react-native';
import { AITheme } from '@/constants/AITheme';
import { BlurHeader } from '@/components/ui/BlurHeader';

// Property Management Staff Profile Data
const mockStaffProfile = {
  maintenanceJobsCompleted: 127,
  inspectionsCompleted: 34,
  tenantSatisfactionRating: 4.6,
  averageResponseTime: '2.1 hours',
  efficiency: 91,
  specializations: ['Plumbing', 'HVAC Systems', 'Electrical Repair', 'General Maintenance'],
  certifications: [
    { name: 'EPA 608 Certification', issueDate: '2023-03-15', expiryDate: '2026-03-15' },
    { name: 'OSHA 10-Hour Safety', issueDate: '2023-01-20', expiryDate: '2026-01-20' },
    { name: 'Property Management License', issueDate: '2022-08-10', expiryDate: '2025-08-10' },
    { name: 'HVAC Technician License', issueDate: '2022-05-05', expiryDate: '2025-05-05' }
  ],
  monthlyPerformance: {
    maintenanceCompleted: 23,
    emergencyResponseTime: '1.8 hours',
    tenantCompliments: 8,
    workOrdersOnTime: 21
  }
};

export default function ProfileScreen() {
  const { user, signOut, signOutToProfileSelection, isLoading: authLoading } = useAuth();
  const { expoPushToken, simulateJobNotification } = useJobNotifications();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Choose how you want to sign out:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch Profile',
          onPress: async () => {
            try {
              await signOutToProfileSelection();
            } catch (error) {
              Alert.alert('Error', 'Failed to switch profile.');
            }
          }
        },
        {
          text: 'Complete Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              console.log('✅ Sign out completed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out.');
            }
          }
        }
      ]
    );
  };



  // Enhanced ProfileItem component with AI theme
  const ProfileItem = ({
    icon: Icon,
    label,
    value,
    onPress,
    showChevron = false
  }: {
    icon: any;
    label: string;
    value?: string;
    onPress?: () => void;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between p-4 border-b border-white/10"
      style={{
        backgroundColor: onPress ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
      }}
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}
        >
          <Icon size={20} color="#8b5cf6" />
        </View>
        <View className="flex-1">
          <Text className="text-white text-base font-medium mb-1">
            {label}
          </Text>
          {value && (
            <Text className="text-gray-400 text-sm">
              {value}
            </Text>
          )}
        </View>
      </View>
      {showChevron && (
        <ChevronRight size={16} color="#6b7280" />
      )}
    </TouchableOpacity>
  );

  // Enhanced StatCard component with AI theme
  const StatCard = ({
    title,
    value,
    IconComponent,
    color,
    trend,
    index = 0
  }: {
    title: string;
    value: number | string;
    IconComponent: any;
    color: string;
    trend?: number;
    index?: number;
  }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={600}
      delay={index * 100}
      className="flex-1"
    >
      <View className="overflow-hidden rounded-2xl border border-white/10">
        {Platform.OS !== 'web' ? (
          <BlurView intensity={30} tint="dark" className="absolute inset-0" />
        ) : (
          <View
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          />
        )}
        <LinearGradient
          colors={[`${color}15`, `${color}08`]}
          className="p-4 items-center"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center mb-3"
            style={{ backgroundColor: `${color}20` }}
          >
            <IconComponent size={24} color={color} />
          </View>
          <Text className="text-white font-bold text-xl mb-1">
            {value}
          </Text>
          <Text className="text-gray-400 text-sm text-center">
            {title}
          </Text>
          {trend && (
            <View className="flex-row items-center mt-2">
              <TrendingUp
                size={12}
                color={trend > 0 ? '#10b981' : '#ef4444'}
              />
              <Text
                className="text-xs font-medium ml-1"
                style={{ color: trend > 0 ? '#10b981' : '#ef4444' }}
              >
                {trend > 0 ? '+' : ''}{trend}%
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>
    </Animatable.View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Enhanced Dark-to-Blue Gradient Background */}
      <LinearGradient
        colors={[
          '#000000', // Pure black at top
          '#0a0a0a', // Very dark gray
          '#1a1a2e', // Dark blue-gray
          '#16213e', // Darker blue
          '#0f3460', // Deep blue
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      {/* Secondary gradient overlay for depth */}
      <LinearGradient
        colors={[
          'rgba(139, 92, 246, 0.1)', // Purple overlay
          'transparent',
          'rgba(59, 130, 246, 0.15)', // Blue overlay
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      {/* BlurHeader Component */}
      <BlurHeader
        title="Profile"
        subtitle={`${user?.role || 'Staff'} • Account Management`}
        intensity={70}
        tint="light"
        showNotificationButton={false}
        showSettingsButton={true}
        onSettingsPress={() => Alert.alert('Settings', 'Settings panel coming soon...')}
        rightComponent={
          <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
            <User size={20} color="white" />
          </View>
        }
      />

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Enhanced User Card */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={200}
          className="mb-6"
        >
          <View className="overflow-hidden rounded-2xl border border-white/10">
            {Platform.OS !== 'web' ? (
              <BlurView intensity={40} tint="dark" className="absolute inset-0" />
            ) : (
              <View
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
              />
            )}
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
              className="p-6"
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View className="flex-row items-center">
                <LinearGradient
                  colors={['#8b5cf6', '#7c3aed']}
                  className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <User size={32} color="#ffffff" />
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold mb-1">
                    {user?.name || 'Sia Moon'}
                  </Text>
                  <Text className="text-purple-300 text-base mb-2">
                    {user?.role === 'admin' ? 'Administrator' : 'Property Manager'}
                  </Text>
                  <View className="flex-row items-center bg-green-500/20 px-3 py-1 rounded-full self-start">
                    <View className="w-2 h-2 rounded-full bg-green-400 mr-2" />
                    <Text className="text-green-400 text-sm font-medium">Active</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animatable.View>

        {/* Performance Stats Grid */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={300}
          className="mb-8"
        >
          <Text className="text-white text-xl font-bold mb-6 tracking-tight">
            Performance Overview
          </Text>

          <View className="flex-row gap-3 mb-4">
            <StatCard
              title="Maintenance Jobs"
              value={mockStaffProfile.maintenanceJobsCompleted}
              IconComponent={Wrench}
              color="#10b981"
              trend={15}
              index={0}
            />
            <StatCard
              title="Inspections"
              value={mockStaffProfile.inspectionsCompleted}
              IconComponent={CheckCircle}
              color="#3b82f6"
              trend={8}
              index={1}
            />
          </View>

          <View className="flex-row gap-3">
            <StatCard
              title="Tenant Rating"
              value={mockStaffProfile.tenantSatisfactionRating}
              IconComponent={Star}
              color="#f59e0b"
              trend={5}
              index={2}
            />
            <StatCard
              title="Response Time"
              value={mockStaffProfile.averageResponseTime}
              IconComponent={Clock}
              color="#ef4444"
              trend={-12}
              index={3}
            />
          </View>
        </Animatable.View>

        {/* Specializations Section */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={400}
          className="mb-8"
        >
          <View className="overflow-hidden rounded-2xl border border-white/10">
            {Platform.OS !== 'web' ? (
              <BlurView intensity={30} tint="dark" className="absolute inset-0" />
            ) : (
              <View
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              />
            )}
            <View className="p-6">
              <Text className="text-white text-lg font-semibold mb-4">
                Specializations
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {mockStaffProfile.specializations.map((spec, index) => (
                  <View
                    key={index}
                    className="bg-purple-500/20 px-3 py-2 rounded-xl border border-purple-500/30"
                  >
                    <Text className="text-purple-300 text-sm font-medium">
                      {spec}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Animatable.View>

        {/* Certifications Section */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={500}
          className="mb-8"
        >
          <View className="overflow-hidden rounded-2xl border border-white/10">
            {Platform.OS !== 'web' ? (
              <BlurView intensity={30} tint="dark" className="absolute inset-0" />
            ) : (
              <View
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              />
            )}
            <View className="p-6">
              <Text className="text-white text-lg font-semibold mb-4">
                Certifications
              </Text>
              <View className="gap-3">
                {mockStaffProfile.certifications.map((cert, index) => (
                  <View
                    key={index}
                    className="bg-white/5 p-4 rounded-xl border border-white/10"
                  >
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-white font-medium flex-1">
                        {cert.name}
                      </Text>
                      <View className="bg-green-500/20 px-2 py-1 rounded-lg">
                        <Text className="text-green-400 text-xs font-medium">
                          Valid
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-400 text-sm">
                      Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Animatable.View>

        {/* Contact Information */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={600}
          className="mb-8"
        >
          <View className="overflow-hidden rounded-2xl border border-white/10">
            {Platform.OS !== 'web' ? (
              <BlurView intensity={30} tint="dark" className="absolute inset-0" />
            ) : (
              <View
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              />
            )}
            <View className="p-6">
              <Text className="text-white text-lg font-semibold mb-4">
                Contact Information
              </Text>
              <ProfileItem
                icon={Mail}
                label="Email"
                value={user?.email || 'sia.moon@property.com'}
              />
              <ProfileItem
                icon={Phone}
                label="Phone"
                value="+1 (555) 123-4567"
              />
            </View>
          </View>
        </Animatable.View>

        {/* App Settings */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={700}
          className="mb-8"
        >
          <View className="overflow-hidden rounded-2xl border border-white/10">
            {Platform.OS !== 'web' ? (
              <BlurView intensity={30} tint="dark" className="absolute inset-0" />
            ) : (
              <View
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              />
            )}
            <View className="p-6">
              <Text className="text-white text-lg font-semibold mb-4">
                App Settings
              </Text>
              <ProfileItem
                icon={Bell}
                label="Notifications"
                value={expoPushToken ? "Enabled" : "Disabled"}
                onPress={() => {
                  Alert.alert(
                    'Notifications',
                    expoPushToken
                      ? 'Push notifications are enabled'
                      : 'Push notifications are disabled. Please enable them in your device settings.',
                    [{ text: 'OK' }]
                  );
                }}
                showChevron
              />
              <ProfileItem
                icon={MapPin}
                label="Location Services"
                value="Enabled"
                onPress={() => {
                  Alert.alert(
                    'Location Services',
                    'Location access is required for navigation to job sites.',
                    [{ text: 'OK' }]
                  );
                }}
                showChevron
              />
            </View>
          </View>
        </Animatable.View>

        {/* Developer Tools */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={800}
          className="mb-8"
        >
          <View className="overflow-hidden rounded-2xl border border-white/10">
            {Platform.OS !== 'web' ? (
              <BlurView intensity={30} tint="dark" className="absolute inset-0" />
            ) : (
              <View
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              />
            )}
            <View className="p-6">
              <Text className="text-white text-lg font-semibold mb-4">
                Developer Tools
              </Text>
              <ProfileItem
                icon={Settings}
                label="Test Notification"
                onPress={simulateJobNotification}
                showChevron
              />
              <ProfileItem
                icon={Shield}
                label="Push Token"
                value={expoPushToken ? "Active" : "Not Available"}
                onPress={() => {
                  if (expoPushToken) {
                    Alert.alert(
                      'Push Token',
                      expoPushToken.substring(0, 50) + '...',
                      [{ text: 'OK' }]
                    );
                  }
                }}
                showChevron
              />
              <ProfileItem
                icon={User}
                label="Account Type"
                value={user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
              />
            </View>
          </View>
        </Animatable.View>

        {/* App Info */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={900}
          className="items-center py-6 px-4 mb-6"
        >
          <Text className="text-gray-500 text-sm text-center mb-1">
            Sia Moon Property Management
          </Text>
          <Text className="text-gray-500 text-sm text-center mb-1">
            Mobile App v2.0.0
          </Text>
          <Text className="text-gray-500 text-sm text-center">
            Current User: {user?.email || 'Not logged in'}
          </Text>
        </Animatable.View>

        {/* Sign Out Button */}
        <Animatable.View
          animation="fadeInUp"
          duration={600}
          delay={1000}
          className="px-4 pb-6 items-center"
        >
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-red-500 px-8 py-4 rounded-2xl"
            style={{
              shadowColor: '#ef4444',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text className="text-white text-base font-bold text-center">
              Sign Out
            </Text>
          </TouchableOpacity>
        </Animatable.View>
      </ScrollView>
    </View>
  );
}


