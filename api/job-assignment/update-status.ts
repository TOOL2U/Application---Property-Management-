/**
 * Job Status Update API Endpoint
 * POST /api/job-assignment/update-status
 * Updates job status from mobile app to webapp
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { adminJobAssignmentService } from '@/lib/firebaseAdmin';
import type { JobStatusUpdate, JobStatusUpdateResponse } from '@/types/jobAssignment';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<JobStatusUpdateResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    // Initialize Firebase Admin if not already done
    adminJobAssignmentService.init();

    // Validate request body
    const statusUpdate: JobStatusUpdate = req.body;
    
    if (!statusUpdate.jobId || !statusUpdate.staffId || !statusUpdate.status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: jobId, staffId, status'
      });
    }

    // Validate status
    const validStatuses = ['assigned', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(statusUpdate.status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    console.log('📱 Processing job status update:', {
      jobId: statusUpdate.jobId,
      staffId: statusUpdate.staffId,
      status: statusUpdate.status
    });

    const firestore = adminJobAssignmentService.getFirestore();
    
    // Get current job
    const jobDoc = await firestore.collection('job_assignments').doc(statusUpdate.jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const currentJob = { id: jobDoc.id, ...jobDoc.data() };

    // Verify staff ownership
    if (currentJob.staffId !== statusUpdate.staffId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: Job not assigned to this staff member'
      });
    }

    // Prepare update data
    const updateData: any = {
      status: statusUpdate.status,
      updatedAt: new Date(),
      version: (currentJob.version || 0) + 1
    };

    // Handle specific status updates
    switch (statusUpdate.status) {
      case 'accepted':
        updateData.accepted = true;
        updateData.acceptedAt = new Date();
        break;
      
      case 'rejected':
        updateData.accepted = false;
        updateData.rejectedAt = new Date();
        updateData.rejectionReason = statusUpdate.rejectionReason;
        
        if (!statusUpdate.rejectionReason) {
          return res.status(400).json({
            success: false,
            error: 'Rejection reason is required when rejecting a job'
          });
        }
        break;
      
      case 'in_progress':
        updateData.startedAt = statusUpdate.startedAt ? 
          new Date(statusUpdate.startedAt) : 
          new Date();
        break;
      
      case 'completed':
        updateData.completedAt = statusUpdate.completedAt ? 
          new Date(statusUpdate.completedAt) : 
          new Date();
        updateData.actualDuration = statusUpdate.actualDuration;
        updateData.completionNotes = statusUpdate.completionNotes;
        
        // Update requirements if provided
        if (statusUpdate.requirementUpdates) {
          const updatedRequirements = currentJob.requirements?.map((req: any) => {
            const reqUpdate = statusUpdate.requirementUpdates?.find(u => u.requirementId === req.id);
            if (reqUpdate) {
              return {
                ...req,
                isCompleted: reqUpdate.isCompleted,
                completedAt: reqUpdate.isCompleted ? new Date() : undefined,
                notes: reqUpdate.notes
              };
            }
            return req;
          }) || [];
          updateData.requirements = updatedRequirements;
        }
        break;
    }

    // Update the document
    await firestore.collection('job_assignments').doc(statusUpdate.jobId).update(updateData);

    // Get updated job
    const updatedJobDoc = await firestore.collection('job_assignments').doc(statusUpdate.jobId).get();
    const updatedJob = { id: updatedJobDoc.id, ...updatedJobDoc.data() };

    // Log the status change event
    await firestore.collection('job_events').add({
      type: 'job_status_changed',
      jobId: statusUpdate.jobId,
      staffId: statusUpdate.staffId,
      timestamp: new Date(),
      data: { 
        status: statusUpdate.status, 
        previousStatus: currentJob.status 
      },
      triggeredBy: statusUpdate.staffId,
      source: 'mobile'
    });

    // Send notification to admin/webapp about status change
    try {
      const messaging = adminJobAssignmentService.getMessaging();
      
      // Get admin/manager FCM tokens (you would implement this based on your admin user system)
      // For now, we'll just log the notification
      let notificationTitle = '';
      let notificationBody = '';

      switch (statusUpdate.status) {
        case 'accepted':
          notificationTitle = '✅ Job Accepted';
          notificationBody = `${currentJob.title} has been accepted by ${currentJob.staffId}`;
          break;
        case 'rejected':
          notificationTitle = '❌ Job Rejected';
          notificationBody = `${currentJob.title} has been rejected by ${currentJob.staffId}`;
          break;
        case 'completed':
          notificationTitle = '🎉 Job Completed';
          notificationBody = `${currentJob.title} has been completed by ${currentJob.staffId}`;
          break;
        default:
          notificationTitle = '📋 Job Updated';
          notificationBody = `${currentJob.title} status changed to ${statusUpdate.status}`;
      }

      console.log('📱 Would send admin notification:', notificationTitle, notificationBody);
      
      // TODO: Implement admin notification system
      // This would send notifications to admin/manager devices
      
    } catch (notificationError) {
      console.error('⚠️ Failed to send admin notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Send webhook notification to external systems (if configured)
    try {
      await sendWebhookNotification({
        event: `job.${statusUpdate.status}` as any,
        timestamp: new Date().toISOString(),
        jobAssignment: updatedJob,
        previousStatus: currentJob.status,
        triggeredBy: statusUpdate.staffId,
        source: 'mobile'
      });
    } catch (webhookError) {
      console.error('⚠️ Failed to send webhook notification:', webhookError);
      // Don't fail the request if webhook fails
    }

    console.log('✅ Job status updated successfully:', statusUpdate.jobId, statusUpdate.status);

    return res.status(200).json({
      success: true,
      job: updatedJob
    });

  } catch (error) {
    console.error('❌ Error in job status update API:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Send webhook notification to external systems
 */
async function sendWebhookNotification(payload: any): Promise<void> {
  // This would send notifications to external systems like:
  // - Property management systems
  // - Booking platforms
  // - Accounting systems
  // - Customer notification systems
  
  const webhookUrl = process.env.JOB_ASSIGNMENT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('📡 No webhook URL configured, skipping webhook notification');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WEBHOOK_SECRET}`,
        'X-Event-Type': payload.event,
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('✅ Webhook notification sent successfully');
    } else {
      console.error('❌ Webhook notification failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Error sending webhook notification:', error);
  }
}

// API route configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
