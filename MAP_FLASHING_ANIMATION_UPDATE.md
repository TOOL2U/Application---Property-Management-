# Map Flashing Animation Update - COMPLETE ✅

## Change Made
Modified map marker flashing animation to only flash for **pending jobs** (yellow markers) instead of active jobs (green markers).

## Previous Behavior ❌
- **Pending jobs** (yellow) → Static
- **Active jobs** (green) → **Flashing** ✨
- **No jobs** (grey) → Static

**Problem:** Flashing green markers drew attention to jobs that were already accepted/in-progress, which don't need immediate attention.

## New Behavior ✅
- **Pending jobs** (yellow) → **Flashing** ✨
- **Active jobs** (green) → Static
- **No jobs** (grey) → Static

**Solution:** Flashing yellow markers draw attention to jobs that **need to be accepted**.

## Rationale

### Why Flash Pending Jobs?
- **Urgent Action Required** - Pending jobs need cleaner to accept them
- **Draw Attention** - Flashing yellow is more noticeable than static
- **Clear Priority** - Visual indicator that action is needed

### Why NOT Flash Active Jobs?
- **Already Accepted** - No urgent action needed
- **Reduce Visual Noise** - Too many flashing markers is distracting
- **Status Clarity** - Solid green means "confirmed and under control"

## Visual Status Guide

| Marker | Status | Animation | Meaning | Action Needed |
|--------|--------|-----------|---------|---------------|
| 🟡✨ Yellow Flashing | pending/assigned/offered | Pulsing 800ms | **Needs acceptance** | Accept job now! |
| 🟢 Green Solid | accepted/in_progress | Static | Job confirmed | Continue work |
| ⚪ Grey Solid | No jobs | Static | No work scheduled | None |

## User Experience Flow

### Scenario: New Job Assigned
1. **Webapp assigns job** → Status: `pending`
2. **Mobile map updates** → Yellow marker appears and **FLASHES** ✨
3. **Cleaner notices** → "Oh, there's a new job!"
4. **Cleaner accepts job** → Status: `accepted`
5. **Marker turns green** → Stops flashing, shows solid green
6. **Visual feedback** → "Job is mine, no further action on map needed"

### Benefits
- **Clear visual hierarchy** - Flashing = needs attention, solid = under control
- **Reduced distraction** - Less visual noise from confirmed jobs
- **Better UX** - Cleaners immediately see what needs action
- **Intuitive** - Matches common UI patterns (flashing = alert/action needed)

## Technical Implementation

### Code Changes
```typescript
// BEFORE:
const isActive = property.status === 'active';
opacity: isActive ? flashAnim : 1

// AFTER:
const isPending = property.status === 'pending';
opacity: isPending ? flashAnim : 1
```

### Animation Details
- **Duration:** 800ms pulse cycle (400ms fade out, 400ms fade in)
- **Opacity range:** 0.3 to 1.0
- **Loop:** Infinite until status changes
- **Performance:** Uses native driver for smooth 60 FPS

## Status Priority Reminder

When property has multiple jobs, highest priority determines marker:
1. `in_progress` (4) → Green solid
2. `accepted` (3) → Green solid
3. `assigned` (2) → **Yellow flashing** ✨
4. `pending` (1) → **Yellow flashing** ✨
5. `offered` (1) → **Yellow flashing** ✨

## Testing Checklist

- [ ] Pending job shows yellow flashing marker
- [ ] Accept job → Marker turns green and stops flashing
- [ ] Start job → Marker stays green (no flashing)
- [ ] Multiple pending jobs → Marker keeps flashing
- [ ] Animation smooth at 60 FPS
- [ ] No performance degradation with many markers

## Files Modified
- `app/(tabs)/map.tsx` - Changed flashing condition from `isActive` to `isPending`

## Status
✅ COMPLETE - Flashing now only for pending jobs that need acceptance

## Impact
**Positive UX Changes:**
- ✨ Immediate attention to jobs needing acceptance
- 🎯 Clear visual priority (flashing = action needed)
- 🧘 Less visual noise (no flashing for confirmed jobs)
- 📱 More intuitive interface (matches user expectations)
