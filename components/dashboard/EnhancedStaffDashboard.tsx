/**
 * Enhanced Staff Dashboard with Job Assignment Integration
 * Real-time job assignments from webapp with acceptance/rejection workflow
 */

import React from 'react';
import StaffJobsDashboard from '@/components/dashboard/StaffJobsDashboard';
import { Job } from '@/types/job';

interface EnhancedStaffDashboardProps {
  user: any;
  refreshing: boolean;
  onRefresh: () => void;
  pendingJobs?: Job[];
  onAcceptJob?: (jobId: string) => Promise<void>;
  onDeclineJob?: (jobId: string) => Promise<void>;
}

export default function EnhancedStaffDashboard({
  user,
  refreshing,
  onRefresh,
  pendingJobs,
  onAcceptJob,
  onDeclineJob
}: EnhancedStaffDashboardProps) {
  // Pass test job props to StaffJobsDashboard
  return (
    <StaffJobsDashboard
      testPendingJobs={pendingJobs}
      onTestAcceptJob={onAcceptJob}
      onTestDeclineJob={onDeclineJob}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}
