# Settings Component

This component handles application settings and preferences. It uses a modular structure to separate concerns and make it easier to add new settings.

## Structure

- `types.ts`: Type definitions specific to settings (theme options, etc.)
- `constants.ts`: Constants like storage keys, default values, and options
- `utils/`: Utility functions for handling settings:
  - `storage.ts`: Functions for loading and saving API URL and tool behavior settings
  - `theme.ts`: Functions for managing theme settings
- `Settings.tsx`: Main component for rendering the settings UI
- `Settings.css`: Component-specific styles

## Adding New Settings

To add a new setting:

1. Define any new types in `types.ts` if needed
2. Add storage keys and default values in `constants.ts`
3. Add utility functions in `utils/` for loading/saving the new setting
4. Update the Settings component UI to display and manage the new setting

### Example: Adding a new "Notifications" setting

1. In `constants.ts`:
```typescript
export const NOTIFICATIONS_KEY = 'settings_notifications';
export const defaultNotifications = {
  enabled: true,
  sound: true
};
```

2. In `types.ts`:
```typescript
export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
}
```

3. In `utils/storage.ts`:
```typescript
export const getNotificationSettings = (): NotificationSettings => {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { ...defaultNotifications };
    }
  }
  return { ...defaultNotifications };
};

export const saveNotificationSettings = (settings: NotificationSettings): void => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(settings));
};
```

4. In `Settings.tsx`, add UI controls and state management for the new setting
