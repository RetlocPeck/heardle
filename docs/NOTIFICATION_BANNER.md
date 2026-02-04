# Notification Banner

## Overview

The notification banner system allows you to display important announcements to users under the navbar. Notifications are dismissible and use localStorage to remember user preferences.

## Features

- ✅ Appears under navbar on all pages
- ✅ Smooth slide-down animation
- ✅ Mobile responsive with optimized text sizes
- ✅ Dismissible with localStorage persistence
- ✅ Customizable message, icon, and ID
- ✅ Beautiful gradient background matching app theme

## Usage

### Basic Example

```tsx
import NotificationBanner from '@/components/ui/NotificationBanner';

<NotificationBanner
  id="unique-notification-id"
  message="Your announcement message here"
  icon="🎉"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | required | Unique identifier for the notification (used for dismissal tracking) |
| `message` | `string` | required | The notification message to display |
| `icon` | `string` | `'🎉'` | Emoji or icon to display before the message |
| `dismissible` | `boolean` | `true` | Whether to show the dismiss button |

## Current Implementation

The banner is currently displayed on:
- **Home page** (`/`)
- **Artist pages** (`/[artist]`)

### Current Message

```tsx
<NotificationBanner
  id="new-artists-2026-02"
  message="🎵 New Update! We've added over 100 K-pop artists to the collection. Explore and test your knowledge!"
  icon="✨"
/>
```

## How Dismissal Works

1. User clicks the `×` button
2. Component animates out (300ms fade)
3. `localStorage.setItem('notification-{id}-dismissed', 'true')` is set
4. Notification won't appear again for this user/browser
5. Changing the `id` prop will show a new notification

## Mobile Considerations

The component is fully responsive:

| Screen Size | Text Size | Icon Size | Padding |
|-------------|-----------|-----------|---------|
| **Mobile** | `text-xs` (12px) | `text-lg` (18px) | `py-2` (8px) |
| **Tablet** | `text-sm` (14px) | `text-xl` (20px) | `py-3` (12px) |
| **Desktop** | `text-base` (16px) | `text-xl` (20px) | `py-3` (12px) |

The dismiss button scales from `w-4 h-4` on mobile to `w-5 h-5` on larger screens.

## Creating New Notifications

When you want to announce something new:

1. **Change the `id` prop** to a new unique value (users who dismissed the old one will see the new one)
2. **Update the message** with your announcement
3. **Choose an appropriate icon** (emojis work great!)

### Example: New Feature Announcement

```tsx
<NotificationBanner
  id="feature-statistics-2026-03"
  message="New feature! Track your progress with detailed statistics. Click the stats button to view!"
  icon="📊"
/>
```

### Example: Limited Time Event

```tsx
<NotificationBanner
  id="event-holiday-2026-12"
  message="🎄 Happy Holidays! Special holiday-themed songs available this week only!"
  icon="🎁"
/>
```

## Styling

The banner uses the app's gradient theme:
- Background: `from-purple-500/20 to-pink-500/20` with backdrop blur
- Border: Bottom border with `border-white/10`
- Text: White with varying opacity for hierarchy
- Animation: Smooth slide-down with opacity fade-in

## Testing

### Test Dismissal

1. Load the page
2. Click the `×` button
3. Refresh the page → notification should not appear
4. Open DevTools → Application → Local Storage
5. Find key: `notification-{id}-dismissed`
6. Delete the key
7. Refresh → notification reappears

### Test on Mobile

1. Open DevTools
2. Toggle device toolbar (mobile view)
3. Verify text is readable
4. Verify dismiss button is easy to tap
5. Check animation smoothness

## Accessibility

- Dismiss button has `aria-label="Dismiss notification"`
- Icon has `aria-hidden="true"` (decorative)
- Keyboard accessible with focus ring
- Color contrast meets WCAG AA standards

## Removing the Banner

To remove the notification entirely:

1. Delete the `<NotificationBanner />` component from pages
2. Or set a future date in the ID and update message when needed

## Files

- **Component**: `src/components/ui/NotificationBanner.tsx`
- **Used in**: 
  - `src/app/page.tsx` (home page)
  - `src/app/[artist]/page.tsx` (artist pages)
- **Documentation**: `docs/NOTIFICATION_BANNER.md` (this file)

## Best Practices

1. **Keep messages concise** - aim for 1-2 sentences
2. **Use emojis wisely** - they draw attention but don't overuse
3. **Change ID for new announcements** - don't reuse old IDs
4. **Test on mobile first** - most users are on mobile devices
5. **Don't overuse** - too many notifications annoy users
