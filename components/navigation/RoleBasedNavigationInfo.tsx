/**
 * Role-Based Navigation Information Component
 * Shows the current navigation configuration and role-based features
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Home,
  Briefcase,
  User,
  Building,
  Users,
  Calendar,
  Wrench,
  DollarSign,
  MapPin,
  History,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffAuth } from '@/hooks/useStaffAuth';

export default function RoleBasedNavigationInfo() {
  const { user } = useAuth();
  const { hasRole } = useStaffAuth();

  const isStaffUser = hasRole(['cleaner', 'maintenance', 'staff']);
  const isAdminOrManager = hasRole(['admin', 'manager']);

  const navigationTabs = [
    {
      name: 'Dashboard',
      icon: Home,
      description: 'Real-time job assignments and performance overview',
      visibleFor: 'All users',
      enhanced: isStaffUser ? 'Enhanced with job assignment integration' : 'Standard admin dashboard',
      available: true,
    },
    {
      name: 'Jobs',
      icon: Briefcase,
      description: 'Job management and assignment workflow',
      visibleFor: 'All users',
      enhanced: isStaffUser ? 'Real-time job assignments with acceptance workflow' : 'Job creation and management',
      available: true,
    },
    {
      name: 'Profile',
      icon: User,
      description: 'User profile and account settings',
      visibleFor: 'All users',
      enhanced: 'Staff authentication and preferences',
      available: true,
    },
    {
      name: 'Properties',
      icon: Building,
      description: 'Property management and details',
      visibleFor: 'Admin/Manager only',
      enhanced: 'Full property management suite',
      available: !isStaffUser && isAdminOrManager,
    },
    {
      name: 'Tenants',
      icon: Users,
      description: 'Tenant management and communication',
      visibleFor: 'Admin/Manager only',
      enhanced: 'Tenant relationship management',
      available: !isStaffUser && isAdminOrManager,
    },
    {
      name: 'Schedule',
      icon: Calendar,
      description: 'Scheduling and calendar management',
      visibleFor: 'Admin/Manager only',
      enhanced: 'Advanced scheduling features',
      available: !isStaffUser && isAdminOrManager,
    },
    {
      name: 'Maintenance',
      icon: Wrench,
      description: 'Maintenance request management',
      visibleFor: 'Admin/Manager only',
      enhanced: 'Maintenance workflow management',
      available: !isStaffUser && isAdminOrManager,
    },
    {
      name: 'Payments',
      icon: DollarSign,
      description: 'Payment processing and financial management',
      visibleFor: 'Admin/Manager only',
      enhanced: 'Financial management suite',
      available: !isStaffUser && isAdminOrManager,
    },
    {
      name: 'Map',
      icon: MapPin,
      description: 'Property location and mapping',
      visibleFor: 'Admin/Manager only',
      enhanced: 'Interactive property mapping',
      available: !isStaffUser && isAdminOrManager,
    },
    {
      name: 'History',
      icon: History,
      description: 'Activity history and audit logs',
      visibleFor: 'Admin/Manager only',
      enhanced: 'Comprehensive audit trail',
      available: !isStaffUser && isAdminOrManager,
    },
  ];

  const staffFeatures = [
    '🔔 Real-time job assignment notifications',
    '📱 Job acceptance/rejection workflow',
    '📋 Enhanced dashboard with pending jobs',
    '📸 Photo upload for job completion',
    '🗺️ Navigation integration for job locations',
    '⏱️ Time tracking and progress updates',
    '✅ Requirement checklist management',
    '🔄 Bi-directional sync with webapp',
  ];

  const adminFeatures = [
    '🏢 Full property management suite',
    '👥 Tenant relationship management',
    '📅 Advanced scheduling and calendar',
    '🔧 Maintenance workflow management',
    '💰 Financial management and payments',
    '🗺️ Interactive property mapping',
    '📊 Analytics and reporting',
    '📋 Complete audit trail and history',
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Role-Based Navigation</Text>
        <Text style={styles.subtitle}>
          Current User: {user?.name || 'Unknown'} ({user?.role || 'No role'})
        </Text>
      </View>

      {/* Navigation Tabs Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Navigation Tabs</Text>
        {navigationTabs.map((tab, index) => {
          const IconComponent = tab.icon;
          return (
            <View key={index} style={styles.tabItem}>
              <View style={styles.tabHeader}>
                <View style={styles.tabIconContainer}>
                  <IconComponent 
                    size={20} 
                    color={tab.available ? '#8b5cf6' : '#6b7280'} 
                  />
                </View>
                <View style={styles.tabInfo}>
                  <Text style={[styles.tabName, { color: tab.available ? '#ffffff' : '#6b7280' }]}>
                    {tab.name}
                  </Text>
                  <Text style={styles.tabVisibility}>{tab.visibleFor}</Text>
                </View>
                <View style={styles.tabStatus}>
                  {tab.available ? (
                    <CheckCircle size={16} color="#22c55e" />
                  ) : (
                    <XCircle size={16} color="#ef4444" />
                  )}
                </View>
              </View>
              <Text style={styles.tabDescription}>{tab.description}</Text>
              <Text style={styles.tabEnhancement}>{tab.enhanced}</Text>
            </View>
          );
        })}
      </View>

      {/* Role-Specific Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {isStaffUser ? 'Staff Features' : 'Admin/Manager Features'}
        </Text>
        <View style={styles.featuresList}>
          {(isStaffUser ? staffFeatures : adminFeatures).map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Integration Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Job Assignment Integration</Text>
        <View style={styles.integrationStatus}>
          <View style={styles.statusItem}>
            <CheckCircle size={16} color="#22c55e" />
            <Text style={styles.statusText}>Real-time job synchronization</Text>
          </View>
          <View style={styles.statusItem}>
            <CheckCircle size={16} color="#22c55e" />
            <Text style={styles.statusText}>Push notification system</Text>
          </View>
          <View style={styles.statusItem}>
            <CheckCircle size={16} color="#22c55e" />
            <Text style={styles.statusText}>Role-based navigation</Text>
          </View>
          <View style={styles.statusItem}>
            <CheckCircle size={16} color="#22c55e" />
            <Text style={styles.statusText}>Enhanced staff workflow</Text>
          </View>
          <View style={styles.statusItem}>
            <CheckCircle size={16} color="#22c55e" />
            <Text style={styles.statusText}>Glassmorphism design system</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  tabItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tabInfo: {
    flex: 1,
  },
  tabName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  tabVisibility: {
    fontSize: 12,
    color: '#8b5cf6',
  },
  tabStatus: {
    marginLeft: 8,
  },
  tabDescription: {
    fontSize: 14,
    color: '#d1d5db',
    marginBottom: 4,
  },
  tabEnhancement: {
    fontSize: 12,
    color: '#8b5cf6',
    fontStyle: 'italic',
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#8b5cf6',
  },
  featureText: {
    fontSize: 14,
    color: '#ffffff',
  },
  integrationStatus: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  bottomSpacing: {
    height: 40,
  },
});
