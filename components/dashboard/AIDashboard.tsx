import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Animatable from 'react-native-animatable';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffAuth } from '@/hooks/useStaffAuth';
import { AITheme } from '@/constants/AITheme';
import {
  Home,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  MapPin,
  Bell,
  Settings,
  LogOut,
  Plus,
  Activity,
  BarChart3,
  Zap,
  Shield,
  Star,
  Target,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// Modern metric card component
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = AITheme.colors.brand.primary,
  trend,
  onPress
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color?: string;
  trend?: { value: string; isPositive: boolean };
  onPress?: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-1 mx-1"
    activeOpacity={0.8}
  >
    <Animatable.View
      animation="fadeInUp"
      duration={600}
      className="overflow-hidden rounded-2xl"
    >
      <BlurView intensity={12} className="absolute inset-0" />
      <LinearGradient
        colors={[AITheme.colors.surface.secondary, AITheme.colors.surface.primary]}
        className="flex-1 p-4"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text
              className="text-sm font-medium opacity-80"
              style={{
                fontFamily: AITheme.typography.fonts.primary,
                color: AITheme.colors.text.secondary,
              }}
            >
              {title}
            </Text>
            <Text
              className="text-2xl font-bold mt-1"
              style={{
                fontFamily: AITheme.typography.fonts.primary,
                color: AITheme.colors.text.primary,
              }}
            >
              {value}
            </Text>
          </View>
          <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${color}20` }}>
            <Icon size={20} color={color} />
          </View>
        </View>
        
        {subtitle && (
          <Text
            className="text-xs opacity-60"
            style={{
              fontFamily: AITheme.typography.fonts.primary,
              color: AITheme.colors.text.tertiary,
            }}
          >
            {subtitle}
          </Text>
        )}
        
        {trend && (
          <View className="flex-row items-center mt-2">
            <TrendingUp 
              size={12} 
              color={trend.isPositive ? AITheme.colors.status.success : AITheme.colors.status.error} 
            />
            <Text
              className="text-xs ml-1 font-medium"
              style={{
                color: trend.isPositive ? AITheme.colors.status.success : AITheme.colors.status.error,
                fontFamily: AITheme.typography.fonts.primary,
              }}
            >
              {trend.value}
            </Text>
          </View>
        )}
      </LinearGradient>
    </Animatable.View>
  </TouchableOpacity>
);

// Action card component
const ActionCard = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  color = AITheme.colors.brand.primary,
  onPress
}: {
  title: string;
  subtitle: string;
  icon: any;
  color?: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="mb-4"
    activeOpacity={0.8}
  >
    <Animatable.View
      animation="fadeInUp"
      duration={600}
      className="overflow-hidden rounded-2xl"
    >
      <BlurView intensity={12} className="absolute inset-0" />
      <LinearGradient
        colors={[AITheme.colors.surface.secondary, AITheme.colors.surface.primary]}
        className="flex-1 p-4"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: `${color}20` }}>
            <Icon size={24} color={color} />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-semibold"
              style={{
                fontFamily: AITheme.typography.fonts.primary,
                color: AITheme.colors.text.primary,
              }}
            >
              {title}
            </Text>
            <Text
              className="text-sm opacity-70 mt-1"
              style={{
                fontFamily: AITheme.typography.fonts.primary,
                color: AITheme.colors.text.secondary,
              }}
            >
              {subtitle}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animatable.View>
  </TouchableOpacity>
);

// Modern section header component
const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
  <View className="flex-row items-center justify-between mb-4">
    <View className="flex-1">
      <Text
        className="text-xl font-bold"
        style={{
          fontFamily: AITheme.typography.fonts.primary,
          color: AITheme.colors.text.primary,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          className="text-sm opacity-70 mt-1"
          style={{
            fontFamily: AITheme.typography.fonts.primary,
            color: AITheme.colors.text.secondary,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
    {action}
  </View>
);

export default function AIDashboard() {
  const { user, signOut } = useAuth();
  const { hasRole } = useStaffAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out.');
            }
          }
        }
      ]
    );
  };

  const isStaff = hasRole(['cleaner', 'maintenance', 'staff']);
  const isAdmin = hasRole(['admin', 'manager']);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getUserRole = () => {
    if (isAdmin) return 'Admin';
    if (isStaff) return 'Staff';
    return 'User';
  };

  return (
    <View className="flex-1" style={{ backgroundColor: AITheme.colors.background.primary }}>
      <StatusBar barStyle="light-content" backgroundColor={AITheme.colors.background.primary} />
      
      {/* Background with subtle gradients */}
      <View className="absolute inset-0">
        <LinearGradient
          colors={[AITheme.colors.background.primary, AITheme.colors.background.secondary]}
          className="flex-1"
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={AITheme.colors.brand.primary}
            />
          }
        >
          {/* Header */}
          <Animatable.View
            animation="fadeInDown"
            duration={800}
            className="px-6 pt-4 pb-6"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  className="text-lg font-medium opacity-80"
                  style={{
                    fontFamily: AITheme.typography.fonts.primary,
                    color: AITheme.colors.text.secondary,
                  }}
                >
                  {getGreeting()}, {user?.email?.split('@')[0] || 'User'}
                </Text>
                <Text
                  className="text-2xl font-bold mt-1"
                  style={{
                    fontFamily: AITheme.typography.fonts.primary,
                    color: AITheme.colors.text.primary,
                  }}
                >
                  {getUserRole()} Dashboard
                </Text>
              </View>
              
              <View className="flex-row items-center space-x-3">
                <TouchableOpacity
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: AITheme.colors.surface.secondary }}
                >
                  <Bell size={20} color={AITheme.colors.text.secondary} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleSignOut}
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: AITheme.colors.status.error + '20' }}
                >
                  <LogOut size={18} color={AITheme.colors.status.error} />
                </TouchableOpacity>
              </View>
            </View>
          </Animatable.View>

          {/* Quick Stats */}
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={200}
            className="px-6 mb-6"
          >
            <SectionHeader title="Quick Stats" subtitle="Your performance overview" />
            
            <View className="flex-row -mx-1">
              <MetricCard
                title="Active Jobs"
                value={12}
                subtitle="2 urgent"
                icon={Activity}
                color={AITheme.colors.accent.blue}
                trend={{ value: "+3 today", isPositive: true }}
              />
              <MetricCard
                title="Completed"
                value={87}
                subtitle="This month"
                icon={CheckCircle}
                color={AITheme.colors.status.success}
                trend={{ value: "+12%", isPositive: true }}
              />
            </View>
            
            <View className="flex-row -mx-1 mt-4">
              <MetricCard
                title="Properties"
                value={24}
                subtitle="Under management"
                icon={Home}
                color={AITheme.colors.accent.cyan}
              />
              <MetricCard
                title="Rating"
                value="4.8"
                subtitle="Customer satisfaction"
                icon={Star}
                color={AITheme.colors.accent.orange}
              />
            </View>
          </Animatable.View>

          {/* Quick Actions */}
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={400}
            className="px-6 mb-6"
          >
            <SectionHeader 
              title="Quick Actions" 
              subtitle="Common tasks"
              action={
                <TouchableOpacity className="flex-row items-center">
                  <Plus size={16} color={AITheme.colors.brand.primary} />
                  <Text className="ml-1 text-sm font-medium" style={{ color: AITheme.colors.brand.primary }}>
                    Add New
                  </Text>
                </TouchableOpacity>
              }
            />
            
            <ActionCard
              title="Create New Job"
              subtitle="Add a new maintenance or cleaning job"
              icon={Plus}
              color={AITheme.colors.brand.primary}
            />
            
            <ActionCard
              title="View Schedule"
              subtitle="Check your upcoming appointments"
              icon={Calendar}
              color={AITheme.colors.accent.blue}
            />
            
            <ActionCard
              title="Property Status"
              subtitle="Monitor all property conditions"
              icon={Shield}
              color={AITheme.colors.status.success}
            />
          </Animatable.View>

          {/* Performance Insights */}
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={600}
            className="px-6 mb-6"
          >
            <SectionHeader 
              title="Performance Insights" 
              subtitle="AI-powered analytics"
              action={
                <TouchableOpacity>
                  <BarChart3 size={20} color={AITheme.colors.brand.primary} />
                </TouchableOpacity>
              }
            />
            
            <View className="overflow-hidden rounded-2xl">
              <BlurView intensity={12} className="absolute inset-0" />
              <LinearGradient
                colors={[AITheme.colors.surface.secondary, AITheme.colors.surface.primary]}
                className="flex-1 p-6"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View className="flex-row items-center mb-4">
                  <Zap size={24} color={AITheme.colors.accent.orange} />
                  <Text
                    className="text-lg font-semibold ml-3"
                    style={{
                      fontFamily: AITheme.typography.fonts.primary,
                      color: AITheme.colors.text.primary,
                    }}
                  >
                    Efficiency Score
                  </Text>
                </View>
                
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className="text-3xl font-bold"
                      style={{
                        fontFamily: AITheme.typography.fonts.primary,
                        color: AITheme.colors.status.success,
                      }}
                    >
                      94%
                    </Text>
                    <Text
                      className="text-sm opacity-70 mt-1"
                      style={{
                        fontFamily: AITheme.typography.fonts.primary,
                        color: AITheme.colors.text.secondary,
                      }}
                    >
                      Above average performance
                    </Text>
                  </View>
                  
                  <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: AITheme.colors.status.success + '20' }}>
                    <Target size={24} color={AITheme.colors.status.success} />
                  </View>
                </View>
              </LinearGradient>
            </View>
          </Animatable.View>

          {/* Recent Activity */}
          <Animatable.View
            animation="fadeInUp"
            duration={800}
            delay={800}
            className="px-6"
          >
            <SectionHeader 
              title="Recent Activity" 
              subtitle="Latest updates"
            />
            
            <View className="space-y-3">
              {[
                { title: 'Job #1234 completed', time: '2 hours ago', icon: CheckCircle, color: AITheme.colors.status.success },
                { title: 'New property added', time: '4 hours ago', icon: Home, color: AITheme.colors.accent.blue },
                { title: 'Schedule updated', time: '1 day ago', icon: Calendar, color: AITheme.colors.accent.cyan },
              ].map((item, index) => (
                <View key={index} className="flex-row items-center p-4 rounded-xl" style={{ backgroundColor: AITheme.colors.surface.secondary }}>
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: item.color + '20' }}>
                    <item.icon size={16} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium" style={{ color: AITheme.colors.text.primary }}>
                      {item.title}
                    </Text>
                    <Text className="text-xs opacity-60 mt-1" style={{ color: AITheme.colors.text.tertiary }}>
                      {item.time}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Animatable.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
