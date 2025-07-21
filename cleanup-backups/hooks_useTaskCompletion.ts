import { useState } from 'react';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import uuid from 'react-native-uuid';

export interface TaskCompletionData {
  taskId: string;
  staffId: string;
  notes?: string;
  issues?: string;
  photos: {
    id: string;
    type: 'before' | 'after' | 'issue' | 'general';
    uri: string;
    caption?: string;
  }[];
  completedAt: Date;
  duration?: number; // actual time spent in minutes
}

export interface PhotoUpload {
  id: string;
  type: 'before' | 'after' | 'issue' | 'general';
  uri: string;
  caption?: string;
}

export function useTaskCompletion() {
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = async (photo: PhotoUpload, taskId: string): Promise<string> => {
    try {
      // Create a unique filename
      const filename = `${taskId}/${photo.type}/${photo.id}.jpg`;
      const storageRef = ref(storage, `task-photos/${filename}`);

      // Convert URI to blob for upload
      const response = await fetch(photo.uri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading photo:', error);
      throw new Error('Failed to upload photo');
    }
  };

  const submitTaskCompletion = async (completionData: TaskCompletionData): Promise<boolean> => {
    try {
      setSubmitting(true);
      setUploadProgress(0);
      setError(null);

      // For demo purposes, simulate the submission process
      console.log('Starting task completion submission:', completionData);

      // Simulate photo uploads with progress
      const uploadedPhotos = [];
      for (let i = 0; i < completionData.photos.length; i++) {
        const photo = completionData.photos[i];
        
        // Simulate upload progress
        setUploadProgress((i / completionData.photos.length) * 80);
        
        // In a real app, this would upload to Firebase Storage:
        // const downloadURL = await uploadPhoto(photo, completionData.taskId);
        
        // For demo, just use the local URI
        uploadedPhotos.push({
          id: photo.id,
          type: photo.type,
          url: photo.uri, // In real app: downloadURL
          caption: photo.caption,
          uploadedAt: new Date(),
        });

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setUploadProgress(90);

      // Create completion record in Firestore
      const completionRecord = {
        taskId: completionData.taskId,
        staffId: completionData.staffId,
        notes: completionData.notes || '',
        issues: completionData.issues || '',
        photos: uploadedPhotos,
        completedAt: completionData.completedAt,
        actualDuration: completionData.duration,
        submittedAt: new Date(),
      };

      // In a real app, this would save to Firestore:
      // const completionsRef = collection(db, 'task-completions');
      // await addDoc(completionsRef, completionRecord);

      // Update task status to completed
      // const taskRef = doc(db, 'tasks', completionData.taskId);
      // await updateDoc(taskRef, {
      //   status: 'completed',
      //   completedAt: serverTimestamp(),
      //   actualDuration: completionData.duration,
      //   completionData: completionRecord,
      //   updatedAt: serverTimestamp(),
      // });

      console.log('Task completion submitted successfully:', completionRecord);
      
      setUploadProgress(100);
      
      // Simulate final processing delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return true;
    } catch (err) {
      console.error('Error submitting task completion:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit task completion');
      return false;
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  return {
    submitting,
    uploadProgress,
    error,
    submitTaskCompletion,
  };
}
