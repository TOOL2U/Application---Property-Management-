# 🧪 Calendar Sync - Quick Testing Guide

**Duration:** 10 minutes  
**Participants:** Mobile team + Webapp team  
**Goal:** Verify real-time calendar sync works

---

## 🎯 Pre-Test Setup

### Webapp Team:
1. ✅ Open webapp in browser
2. ✅ Navigate to calendar page
3. ✅ Open browser console (F12)
4. ✅ Look for: "✅ Job sync to calendar activated"

### Mobile Team:
1. ✅ Mobile app running on device/simulator
2. ✅ Logged in as: `cleaner@siamoon.com`
3. ✅ Navigate to Jobs tab
4. ✅ Identify test job: "Deep Cleaning - Mountain Retreat"

---

## 🧪 Test 1: Accept Job (2 minutes)

### Mobile App Actions:
```
1. Find job with status "Pending" (🟠 should appear if webapp open)
2. Tap on the job to open details
3. Tap "Accept Job" button
4. Wait for success message
```

### Webapp Verification:
```
1. Watch calendar (DO NOT REFRESH)
2. ✅ Event should turn BLUE within 1-2 seconds
3. ✅ Status should update to "Accepted"
4. ✅ Console shows: "🔄 Calendar event updated: accepted → #4169E1"
```

**Result:** [ ] Pass   [ ] Fail  
**Notes:** _________________

---

## 🧪 Test 2: Start Job (2 minutes)

### Mobile App Actions:
```
1. Job details screen should now show "Start Job" button
2. Tap "Start Job" button
3. Wait for success message
```

### Webapp Verification:
```
1. Watch calendar (DO NOT REFRESH)
2. ✅ Event should turn PURPLE within 1-2 seconds
3. ✅ Status should update to "In Progress"
4. ✅ Start time should be recorded
5. ✅ Console shows: "🔄 Calendar event updated: in_progress → #9370DB"
```

**Result:** [ ] Pass   [ ] Fail  
**Notes:** _________________

---

## 🧪 Test 3: Complete Job (3 minutes)

### Mobile App Actions:
```
1. Job details screen should now show "Complete Job" button
2. Tap "Complete Job" button
3. Job Completion Wizard opens
4. Add 1-2 photos (optional)
5. Add completion notes
6. Check off some checklist items
7. Tap "Submit" button
```

### Webapp Verification:
```
1. Watch calendar (DO NOT REFRESH)
2. ✅ Event should turn GREEN within 2-3 seconds
3. ✅ Status should update to "Completed"
4. ✅ Completion time recorded
5. ✅ Console shows: "🔄 Calendar event updated: completed → #228B22"
6. ✅ Event may move to "Completed Jobs" section
```

**Result:** [ ] Pass   [ ] Fail  
**Notes:** _________________

---

## 🧪 Test 4: Offline Sync (3 minutes - Optional)

### Mobile App Actions:
```
1. Create new test job from webapp
2. Mobile app: Enable airplane mode
3. Mobile app: Try to accept the job
4. Should see "queued" or local update
5. Mobile app: Disable airplane mode
6. Wait 5 seconds
```

### Webapp Verification:
```
1. Watch calendar
2. ✅ Event should appear/update once mobile reconnects
3. ✅ Color should change to BLUE
4. ✅ No data loss
```

**Result:** [ ] Pass   [ ] Fail  
**Notes:** _________________

---

## ✅ Success Checklist

### Visual Verification:
- [ ] Orange → Blue transition works (accept)
- [ ] Blue → Purple transition works (start)
- [ ] Purple → Green transition works (complete)
- [ ] Changes happen within 1-3 seconds
- [ ] No page refresh needed
- [ ] Multiple jobs can update simultaneously

### Technical Verification:
- [ ] Console logs show sync messages
- [ ] No Firebase errors in console
- [ ] serverTimestamp() values in Firestore
- [ ] operational_jobs collection updating
- [ ] calendarEvents collection updating

### User Experience:
- [ ] Staff see immediate feedback
- [ ] Managers see real-time updates
- [ ] Status changes are clear
- [ ] No confusion about job state

---

## 🐛 If Tests Fail

### Calendar Event Not Appearing:
```
1. Check Firebase console → operational_jobs
2. Verify job has scheduledStart field
3. Check webapp console for errors
4. Verify calendar sync is activated (console log)
```

### Color Not Changing:
```
1. Check mobile app status strings are exact:
   'accepted' ✅  not 'Accepted' ❌
   'in_progress' ✅  not 'in-progress' ❌
   
2. Check serverTimestamp() being used:
   Open Firestore console
   Check updatedAt field shows server timestamp
   
3. Check webapp console logs:
   Should see: "🔄 Calendar event updated..."
```

### Sync Too Slow (> 5 seconds):
```
1. Check network connection (both devices)
2. Check Firebase WebSocket connection
3. Try with better WiFi/4G connection
4. Check for Firebase throttling
```

---

## 📊 Test Results Summary

| Test | Status | Duration | Notes |
|------|--------|----------|-------|
| Accept Job | [ ] Pass / [ ] Fail | ___ sec | |
| Start Job | [ ] Pass / [ ] Fail | ___ sec | |
| Complete Job | [ ] Pass / [ ] Fail | ___ sec | |
| Offline Sync | [ ] Pass / [ ] Fail | ___ sec | |

**Overall Result:** [ ] ✅ PASS   [ ] ❌ FAIL

**Issues Found:** _________________

**Next Steps:** _________________

---

## 📸 Screenshot Checklist

Take screenshots of:
- [ ] Webapp calendar with orange event (pending)
- [ ] Webapp calendar after mobile accept (blue)
- [ ] Webapp calendar after mobile start (purple)
- [ ] Webapp calendar after mobile complete (green)
- [ ] Browser console showing sync logs
- [ ] Firebase console showing operational_jobs
- [ ] Firebase console showing calendarEvents

---

## 🎉 Success!

If all tests pass:

✅ **Mobile app is successfully syncing with webapp calendar!**

**Next Steps:**
1. Document any issues found
2. Test with more staff members (load testing)
3. Monitor production for first few real jobs
4. Gather user feedback
5. Celebrate! 🎉

---

## 📞 Contact During Testing

**Mobile Team:**
- [ ] Name: _________________
- [ ] Available: Yes / No

**Webapp Team:**
- [ ] Name: _________________
- [ ] Available: Yes / No

**Testing Time:**
- [ ] Scheduled: _________________
- [ ] Completed: _________________

---

**Version:** 1.0  
**Date:** January 9, 2026  
**Status:** Ready for Testing
