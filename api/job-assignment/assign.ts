/**
 * Job Assignment API Endpoint
 * POST /api/job-assignment/assign
 * Assigns a job from webapp to mobile staff
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { adminJobAssignmentService } from '@/lib/firebaseAdmin';
import type { JobAssignmentRequest, JobAssignmentResponse } from '@/types/jobAssignment';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<JobAssignmentResponse>
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
    const assignmentRequest: JobAssignmentRequest = req.body;
    
    if (!assignmentRequest.staffId || !assignmentRequest.title || !assignmentRequest.type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: staffId, title, type'
      });
    }

    // Validate staff ID format
    if (typeof assignmentRequest.staffId !== 'string' || assignmentRequest.staffId.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid staffId format'
      });
    }

    // Validate scheduled date
    if (!assignmentRequest.scheduledFor || isNaN(new Date(assignmentRequest.scheduledFor).getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid scheduledFor date'
      });
    }

    console.log('📋 Processing job assignment request:', {
      staffId: assignmentRequest.staffId,
      title: assignmentRequest.title,
      type: assignmentRequest.type,
      scheduledFor: assignmentRequest.scheduledFor
    });

    // Create job assignment using the service
    const firestore = adminJobAssignmentService.getFirestore();
    
    // Validate staff exists
    const staffDoc = await firestore.collection('staff_accounts').doc(assignmentRequest.staffId).get();
    if (!staffDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Staff member not found'
      });
    }

    // Create the job assignment
    const jobAssignment = {
      staffId: assignmentRequest.staffId,
      propertyId: assignmentRequest.propertyId,
      bookingId: assignmentRequest.bookingId,
      title: assignmentRequest.title,
      description: assignmentRequest.description,
      type: assignmentRequest.type,
      priority: assignmentRequest.priority || 'medium',
      estimatedDuration: assignmentRequest.estimatedDuration || 60,
      location: assignmentRequest.location,
      assignedBy: assignmentRequest.assignedBy,
      assignedAt: new Date(),
      scheduledFor: new Date(assignmentRequest.scheduledFor),
      dueDate: assignmentRequest.dueDate ? new Date(assignmentRequest.dueDate) : undefined,
      status: 'assigned' as const,
      requirements: assignmentRequest.requirements.map((req, index) => ({
        id: `req_${Date.now()}_${index}`,
        ...req,
        isCompleted: false
      })),
      photos: [],
      notificationsSent: [],
      bookingDetails: assignmentRequest.bookingDetails,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };

    // Add to Firestore
    const docRef = await firestore.collection('job_assignments').add(jobAssignment);
    
    const createdJob = {
      id: docRef.id,
      ...jobAssignment
    };

    // Send push notification
    try {
      const messaging = adminJobAssignmentService.getMessaging();
      
      // Get staff FCM tokens
      const staffData = staffDoc.data();
      const fcmTokens = staffData?.fcmTokens || [];
      
      if (fcmTokens.length > 0 && staffData?.notificationPreferences?.pushEnabled !== false) {
        await messaging.sendMulticast({
          tokens: fcmTokens,
          notification: {
            title: '🔔 New Job Assignment',
            body: `${jobAssignment.title} - ${jobAssignment.type.replace('_', ' ')} at ${jobAssignment.location.address}`
          },
          data: {
            type: 'job_assigned',
            jobId: docRef.id,
            staffId: assignmentRequest.staffId,
            priority: jobAssignment.priority,
            scheduledFor: jobAssignment.scheduledFor.toISOString(),
          },
          android: {
            priority: jobAssignment.priority === 'urgent' ? 'high' : 'normal',
          }
        });
        
        console.log('✅ Push notification sent to staff:', assignmentRequest.staffId);
      }
    } catch (notificationError) {
      console.error('⚠️ Failed to send push notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Log the assignment event
    await firestore.collection('job_events').add({
      type: 'job_assigned',
      jobId: docRef.id,
      staffId: assignmentRequest.staffId,
      timestamp: new Date(),
      data: { status: 'assigned' },
      triggeredBy: assignmentRequest.assignedBy,
      source: 'webapp'
    });

    console.log('✅ Job assigned successfully:', docRef.id);

    return res.status(201).json({
      success: true,
      jobId: docRef.id,
      job: createdJob
    });

  } catch (error) {
    console.error('❌ Error in job assignment API:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
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
