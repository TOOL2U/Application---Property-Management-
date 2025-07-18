import { notificationDisplayService } from '@/services/notificationDisplayService';

// Test function to check if the notification system is working
export const testNotificationSystem = async () => {
  console.log('🔔 Testing Notification System...');
  
  try {
    // Test subscribing to notifications
    const unsubscribe = notificationDisplayService.subscribeToNotifications(
      'alan-staff', // Use the test staff account
      (notifications) => {
        console.log('📱 Received notifications:', notifications.length);
        notifications.forEach((notification, index) => {
          console.log(`${index + 1}. ${notification.title} - ${notification.body}`);
          console.log(`   Priority: ${notification.priority}, Read: ${notification.read}`);
        });
      },
      (error) => {
        console.error('❌ Notification error:', error);
      }
    );

    // Test for 5 seconds then unsubscribe
    setTimeout(() => {
      console.log('🛑 Stopping notification test...');
      unsubscribe();
    }, 5000);

    return true;
  } catch (error) {
    console.error('❌ Notification system test failed:', error);
    return false;
  }
};

// Run the test
testNotificationSystem();
