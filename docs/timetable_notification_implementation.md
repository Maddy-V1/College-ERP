# Timetable and Notification System Implementation

## Overview
This document describes the implementation of the timetable management and notification system for the College ERP.

## Features Implemented

### 1. Timetable Management (Admin Portal)

#### Admin Portal - Timetable Page (`/timetables`)
- **Drag and Drop Interface**: Admin can drag subjects from the right panel and drop them into the timetable grid
- **Visual Timetable Grid**: 
  - Days: Monday to Saturday
  - Periods: 8 periods (9 AM to 5 PM)
  - Each slot shows subject code and professor name
- **Class Selection**: Dropdown to select which class to manage
- **Subject Panel**: Shows all subjects assigned to the selected class with their professors
- **Save Functionality**: Saves the complete timetable to the database
- **Remove Slots**: Hover over a slot to see remove button

#### Features:
- Real-time drag and drop
- Visual feedback for drop zones
- Automatic professor assignment display
- Period timing display
- Room number support (can be added later)

### 2. Notification System

#### Admin Portal - Notifications Page (`/notifications`)
- **Send To Options**:
  - All Students: Broadcast to all active students
  - Specific Class: Send to all students in a selected class
  - Individual Students: Select specific students from a list
- **Notification Types**:
  - General Announcement
  - Academic Update
  - Event Notification
  - Urgent Alert
  - Assignment
  - Marks Update
- **Form Fields**:
  - Title (required)
  - Message (required)
  - Notification type selector
  - Recipient selector based on send type

#### Student Portal - Notifications Page (`/notifications`)
- **Notification List**: Shows all notifications with:
  - Icon based on notification type
  - Title and message
  - Timestamp (relative: "2h ago", "3d ago", etc.)
  - Read/unread status
  - Color coding by type
- **Filter Tabs**: 
  - All notifications
  - Unread only
- **Mark as Read**: Click on notification to mark as read
- **Mark All as Read**: Button to mark all notifications as read
- **Unread Badge**: Shows count in bottom navigation

#### Bottom Navigation Badge
- Real-time unread count display
- Auto-refreshes every 30 seconds
- Red badge with count (shows "9+" for 10 or more)

### 3. Automatic Notifications

#### Database Triggers
Created triggers that automatically send notifications when:
- **Marks Added**: Student receives notification when new marks are entered
- **Marks Updated**: Student receives notification when marks are modified

Location: `supabase/migrations/add_notification_triggers.sql`

### 4. Backend API Routes

#### Admin Backend (`admin-backend`)
- `POST /api/admin/v1/timetables/class/:classId` - Create/update timetable
- `GET /api/admin/v1/timetables/class/:classId` - Get timetable for a class
- `GET /api/admin/v1/timetables/class/:classId/subjects` - Get class subjects for drag-drop
- `DELETE /api/admin/v1/timetables/slots/:slotId` - Delete a timetable slot
- `POST /api/admin/v1/notifications/send` - Send to specific users
- `POST /api/admin/v1/notifications/send-to-class` - Send to a class
- `POST /api/admin/v1/notifications/send-to-all-students` - Broadcast to all students
- `GET /api/admin/v1/notifications` - Get all sent notifications

#### Academic Backend (`academic-backend`)
- `GET /api/academic/v1/timetable/class/:classId` - Get timetable for a class
- `GET /api/academic/v1/timetable/professor/:professorId` - Get professor's timetable
- `GET /api/academic/v1/notifications/student/:studentId` - Get student notifications
- `GET /api/academic/v1/notifications/student/:studentId/unread-count` - Get unread count
- `PATCH /api/academic/v1/notifications/:notificationId/read` - Mark as read
- `PATCH /api/academic/v1/notifications/student/:studentId/read-all` - Mark all as read

## Database Schema

### Tables Used
1. **timetables**: Stores timetable metadata
   - `id`, `class_id`, `semester_id`, `effective_from`, `effective_to`, `is_active`

2. **timetable_slots**: Stores individual time slots
   - `id`, `timetable_id`, `class_subject_id`, `day_of_week`, `period_number`
   - `start_time`, `end_time`, `room_number`, `slot_type`

3. **notifications**: Stores all notifications
   - `id`, `recipient_id`, `title`, `message`, `notification_type`
   - `reference_type`, `reference_id`, `is_read`, `created_at`

## Usage Instructions

### For Admins

#### Creating a Timetable:
1. Navigate to Timetables page
2. Select a class from the dropdown
3. Drag subjects from the right panel
4. Drop them into the desired day/period slots
5. Click "Save Timetable" to persist changes

#### Sending Notifications:
1. Navigate to Notifications page
2. Choose send type (All/Class/Individual)
3. Select recipients if needed
4. Choose notification type
5. Enter title and message
6. Click "Send Notification"

### For Students

#### Viewing Notifications:
1. Click on "Alerts" in bottom navigation
2. Badge shows unread count
3. Click on a notification to mark as read
4. Use filter tabs to view all or unread only
5. Click "Mark all as read" to clear all unread

#### Viewing Timetable:
- Timetable is displayed on the Home page
- Shows current day's schedule
- Automatically fetched based on student's class

### For Professors

#### Viewing Timetable:
- Timetable is displayed on the Home page
- Shows all classes the professor teaches
- Organized by day and time

## Future Enhancements

1. **Assignment Notifications**: Add automatic notifications when assignments are created
2. **Room Management**: Add room availability checking
3. **Timetable Conflicts**: Detect and prevent professor/room conflicts
4. **Push Notifications**: Implement browser push notifications
5. **Notification Preferences**: Allow users to customize notification types
6. **Timetable Templates**: Save and reuse timetable templates
7. **Bulk Operations**: Copy timetable from one class to another
8. **Export/Print**: Export timetable as PDF or image

## Technical Notes

- Timetable uses drag-and-drop HTML5 API
- Notifications poll every 30 seconds for updates
- Database triggers ensure automatic notifications
- All times stored in 24-hour format
- Supports 6-day week (Monday to Saturday)
- Maximum 8 periods per day

## Files Created/Modified

### New Files:
- `admin-backend/src/routes/timetable.routes.ts`
- `admin-backend/src/routes/notification.routes.ts`
- `academic-backend/src/routes/timetable.routes.ts`
- `academic-backend/src/routes/notification.routes.ts`
- `admin-portal/src/pages/Timetables.tsx`
- `admin-portal/src/pages/Notifications.tsx`
- `student-portal/src/pages/Notifications.tsx`
- `supabase/migrations/add_notification_triggers.sql`

### Modified Files:
- `admin-backend/src/routes/index.ts`
- `admin-portal/src/App.tsx`
- `admin-portal/src/components/layout/Sidebar.tsx`
- `student-portal/src/App.tsx`
- `student-portal/src/components/Layout.tsx`

## Testing Checklist

- [ ] Admin can create timetable with drag-drop
- [ ] Admin can save timetable successfully
- [ ] Admin can send notifications to all students
- [ ] Admin can send notifications to specific class
- [ ] Admin can send notifications to individual students
- [ ] Student can view notifications
- [ ] Student can mark notifications as read
- [ ] Student sees unread badge in navigation
- [ ] Automatic notifications sent when marks added
- [ ] Timetable displays correctly for students
- [ ] Timetable displays correctly for professors
