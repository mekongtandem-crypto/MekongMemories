# CLAUDE.md - AI Assistant Guide for Mémoire du Mékong

> **Version:** 2.6d "Dark Mode" | **Last Updated:** November 14, 2025
> **Purpose:** Comprehensive guide for AI assistants working on this codebase

---

## 🎯 Project Overview

**Mémoire du Mékong** is a Progressive Web App that transforms a travel diary into an interactive, conversation-based memory exploration platform. Users can discuss and organize travel experiences through themed "sessions" (chats), explore a timeline of "moments" (thematic units), and manage photos and Mastodon posts.

**Current Phase:** Phase 26 - Dark Mode
**Build Date:** November 10, 2025
**Total LOC:** ~8,860 lines
**Language:** JavaScript (no TypeScript), French comments/documentation

---

## 🛠 Tech Stack

### Core
- **React 18.2.0** - UI framework (no class components, all hooks-based)
- **Vite 7.1.7** - Build tool (using defaults, no vite.config.js)
- **JavaScript ES6+** - Modern JS, no TypeScript

### Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS
- **PostCSS + Autoprefixer** - CSS processing
- **Dark Mode:** Class-based (`dark` class on `<html>`)
- **Default theme:** Dark mode

### Backend/Storage
- **Google Drive API** - Primary data persistence
- **Google OAuth 2.0** - Authentication (tokens cached 1h)
- **localStorage** - Client-side caching and preferences

### UI Libraries
- **lucide-react 0.303.0** - Icon library (only UI dependency)

### Development
- **ESLint** - Linting with React Hooks rules
- **Cloudflare Pages** - Deployment platform

---

## 📁 Project Structure

```
MekongMemories/
├── Doc/                          # Development documentation (French)
│   └── dev_guide_v2_*.md        # Versioned dev guides (v2.2 → v2.7)
│
├── public/                       # Static assets
│   ├── manifest.json            # PWA manifest
│   └── splash.jpg               # PWA splash screen
│
├── src/
│   ├── main.jsx                 # ⭐ Entry point with dependency injection
│   ├── index.css                # Global styles + Tailwind imports
│   ├── constants.js             # Application constants
│   │
│   ├── components/              # React components
│   │   ├── App.jsx             # ⭐ Root component with routing logic
│   │   ├── Navigation.jsx      # Bottom navigation bar
│   │   ├── ThemeContext.jsx    # Dark mode context provider
│   │   ├── ThemeModal.jsx      # Theme assignment modal
│   │   ├── PhotoViewer.jsx     # Full-screen photo viewer
│   │   ├── UnifiedTopBar.jsx   # Top bar wrapper
│   │   │
│   │   ├── pages/              # Page components (routing targets)
│   │   │   ├── StartupPage.jsx    # Initialization screen
│   │   │   ├── SessionsPage.jsx   # Chat sessions list
│   │   │   ├── ChatPage.jsx       # Individual chat/session
│   │   │   ├── MemoriesPage.jsx   # Timeline of moments
│   │   │   └── SettingsPage.jsx   # User settings
│   │   │
│   │   ├── topbar/             # Top bar components (page-specific)
│   │   │   ├── ChatTopBar.jsx
│   │   │   ├── MemoriesTopBar.jsx
│   │   │   ├── SessionsTopBar.jsx
│   │   │   └── SettingsTopBar.jsx
│   │   │
│   │   └── memories/           # Memory timeline components
│   │       ├── moment/         # Moment card components
│   │       ├── post/           # Post article components
│   │       ├── photo/          # Photo grid components
│   │       ├── shared/         # Shared memory components
│   │       ├── layout/         # Layout components
│   │       └── hooks/          # Memory-specific hooks
│   │
│   ├── core/                   # ⭐ Core business logic (singletons)
│   │   ├── dataManager.js         # ⭐ Central state manager (pub/sub)
│   │   ├── StateManager.js        # localStorage abstraction
│   │   ├── ConnectionManager.js   # Google OAuth & connection state
│   │   ├── DriveSync.js          # Google Drive file operations
│   │   ├── UserManager.js        # User profiles and styles
│   │   ├── NotificationManager.js # Push notifications
│   │   ├── ContentLinks.js       # Content↔session bidirectional links
│   │   ├── ThemeAssignments.js   # Theme tag assignments
│   │   ├── MastodonData.js       # Mastodon data parsing
│   │   ├── PhotoDataV2.js        # Photo metadata management
│   │   └── MasterIndexGenerator.js # Master timeline index
│   │
│   ├── hooks/
│   │   └── useAppState.js      # ⭐ Main application state hook
│   │
│   ├── config/
│   │   ├── version.js          # Version constants (update here!)
│   │   └── googleDrive.js      # Google Drive API credentials
│   │
│   ├── utils/
│   │   ├── logger.js           # Custom logging system
│   │   ├── storage.js          # localStorage utilities
│   │   ├── sessionUtils.js     # Session formatting/sorting
│   │   ├── themeUtils.js       # Theme utilities
│   │   └── linkUtils.js        # Link utilities
│   │
│   └── styles/
│       └── startup-animations.css
│
├── index.html                   # Entry HTML with PWA meta tags
├── package.json                 # Dependencies and scripts
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
├── eslint.config.js            # ESLint configuration
└── wrangler.toml               # Cloudflare Pages deployment config
```

---

## 🏗 Architecture & Patterns

### State Management: Custom Pub/Sub (No Redux/Zustand)

The app uses a **three-layer custom state management** system:

#### Layer 1: Core Managers (Singletons)

All managers in `/src/core/` are singleton instances exposed on `window` for debugging.

**StateManager** (`StateManager.js`)
- Low-level localStorage wrapper with in-memory cache
- Observable pattern for React subscriptions
- Key prefix: `mekong_v2_`

**dataManager** (`dataManager.js`) - ⭐ **CENTRAL HUB**
- Coordinates all application state
- Pub/Sub pattern for React components
- Manages: sessions, masterIndex, currentUser, etc.
- Methods: `subscribe()`, `notify()`, `getState()`

**Other Managers:**
- `connectionManager` - Google OAuth state
- `driveSync` - Google Drive file I/O
- `userManager` - User profiles and styles
- `notificationManager` - Push notifications
- `contentLinks` - Bidirectional content↔session links
- `themeAssignments` - Theme tag assignments

#### Layer 2: React Hook

**`useAppState()`** (`/src/hooks/useAppState.js`)
- Single source of truth for components
- Subscribes to `dataManager` changes
- Returns state + action methods
- Usage: `const app = useAppState();`

#### Layer 3: Component Consumption

```javascript
import { useAppState } from '../hooks/useAppState.js';

function MyComponent() {
  const app = useAppState();

  // Access state
  const sessions = app.sessions;
  const currentUser = app.currentUser;

  // Call actions
  app.createSession(title, author);
  app.updateSession(sessionId, updates);
}
```

### Routing: Custom Page-Based (No React Router)

**No routing library.** Routing via `currentPage` state in `App.jsx`:

```javascript
const renderPage = () => {
  switch (app.currentPage) {
    case 'memories': return <MemoriesPage />;
    case 'sessions': return <SessionsPage />;
    case 'chat': return <ChatPage />;
    case 'settings': return <SettingsPage />;
  }
}
```

**Navigation:**
- `app.navigateTo(page, context)` - Change page with context
- Context object preserves state during transitions
- Smart back button via `previousPage` state

**Navigation Context Fields:**
- `previousPage` - For back button
- `pendingAttachment` - Photos to attach
- `sessionMomentId` - Moment context
- `pendingLink` - Content links
- `targetContent` - Navigation targets
- `selectionMode` - UI mode

### Dependency Injection

**All manager dependencies are injected in `main.jsx`:**

```javascript
// main.jsx
driveSync.initialize({ connectionManager });
dataManager.initializeDependencies({
  connectionManager,
  driveSync,
  stateManager,
  notificationManager,
  contentLinks
});
```

**Important:** Managers are singletons, but dependencies are explicitly injected to avoid circular imports.

### Observer Pattern (Pub/Sub)

```javascript
// Subscribe
const unsubscribe = dataManager.subscribe(newState => {
  // Handle state change
});

// Later...
unsubscribe();

// Notify (in managers)
dataManager.notify();
```

### Error Handling

- React Error Boundary wraps entire app in `App.jsx`
- Catches render errors and displays fallback UI
- Errors logged via custom logger

---

## 🎨 Styling Conventions

### Dark Mode

**Implementation:**
- Context: `ThemeContext.jsx` provides `useTheme()` hook
- Class-based: Applies `dark` class to `<html>` element
- Default: Dark mode
- Persistence: localStorage key `mekong_theme_mode`

**CSS Variables:**
```css
/* index.css */
:root {
  --color-bg-primary: #f9fafb;
  --color-text-primary: #111827;
  /* ... */
}

.dark {
  --color-bg-primary: #111827;
  --color-text-primary: #f3f4f6;
  /* ... */
}
```

### Tailwind Patterns

**Always use dual classes for light/dark:**
```jsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
```

**Common patterns:**
- Background: `bg-white dark:bg-gray-800`
- Text: `text-gray-900 dark:text-gray-100`
- Borders: `border-gray-200 dark:border-gray-700`
- Transitions: `transition-colors duration-200`

**Color Palette:**
- Primary: Amber (`amber-500`, `amber-600`)
- Accent: Purple (`purple-600`)
- Status: Red, Green, Blue
- Backgrounds: Gray scale (50-900)

**Layout:**
- Mobile-first responsive design
- Fixed top bar: `fixed top-0 w-full z-50`
- Fixed bottom nav: `fixed bottom-0 w-full z-40`
- Main content: `pt-12 pb-16` (compensate for fixed bars)

---

## 💾 Data Persistence

### localStorage Keys

| Key | Description |
|-----|-------------|
| `mekong_v2_sessions` | Sessions array |
| `mekong_v2_currentUser` | Current user ID |
| `mekong_v2_masterIndex` | Master moments timeline |
| `oauth_token` | Google OAuth token (1h TTL) |
| `oauth_token_timestamp` | Token creation timestamp |
| `mekong_theme_mode` | Dark/light mode preference |
| `mekong_sessionSort_{userId}` | Session sort preferences |
| `mekong_sessionReadStatus_{userId}` | Read status tracking |
| `debug_mode` | Enable verbose logging |

### Google Drive Files

| File | Description |
|------|-------------|
| `session_{sessionId}.json` | Individual session data |
| `mekong_master_index_v3_moments.json` | Master timeline index |
| `content-links.json` | Content↔session bidirectional links |
| `theme-assignments.json` | Theme tag assignments |
| `notifications.json` | User notifications |

**Important:** All Drive operations go through `driveSync.js`

---

## 📝 Code Conventions

### File Naming

- **Components:** PascalCase (`.jsx`) - `SessionPage.jsx`
- **Managers/Utils:** camelCase (`.js`) - `dataManager.js`
- **Config files:** kebab-case - `tailwind.config.js`

### Import Organization

**Standard order:**
```javascript
// 1. React/external libraries
import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

// 2. Hooks/contexts
import { useAppState } from '../hooks/useAppState.js';
import { useTheme } from './ThemeContext.jsx';

// 3. Components
import TopBar from './TopBar.jsx';
import Navigation from './Navigation.jsx';

// 4. Core/utils
import { dataManager } from '../core/dataManager.js';
import { logger } from '../utils/logger.js';

// 5. Constants/config
import { APP_VERSION } from '../config/version.js';
```

### Comments & Documentation

**Language:** French for comments and documentation

**Emoji prefixes for visual scanning:**
- ✅ Completed features
- ⭐ Important sections
- 🔗 Link-related code
- 🔍 Debug code
- ⚠️ Warnings
- 🎯 TODO items

**File headers:**
```javascript
/**
 * ComponentName.jsx v2.9 - Phase 19E : Feature Name
 * ✅ Feature 1
 * ✅ Feature 2
 * ⭐ Important note
 */
```

### Logging

**Custom logger** (`/src/utils/logger.js`)

```javascript
import { logger } from '../utils/logger.js';

logger.debug('Debugging info', data);
logger.info('Information');
logger.warn('Warning message');
logger.error('Error occurred', error);
logger.success('Operation successful');
```

**Features:**
- Color-coded console output
- Emoji indicators (🔍 ℹ️ ⚠️ ❌ ✅)
- Toggle via `localStorage.debug_mode = 'true'`
- Disabled in production by default

---

## 🔑 Key Concepts

### Sessions

**What:** Themed conversations/chats about travel memories

**Data structure:**
```javascript
{
  id: 'session_123',
  title: 'Session title',
  author: 'userName',
  messages: [
    {
      id: 'msg_1',
      author: 'userName',
      text: 'Message content',
      timestamp: '2025-11-10T12:00:00Z',
      attachments: ['moment_1', 'photo_1']
    }
  ],
  linkedContent: ['moment_1', 'photo_1'],
  themes: ['culture', 'food'],
  status: 'pending_you', // See SESSION_STATUS
  isArchived: false,
  createdAt: '2025-11-10T12:00:00Z',
  updatedAt: '2025-11-10T13:00:00Z'
}
```

**Session Status:**
```javascript
SESSION_STATUS = {
  NOTIFIED: 'notified',         // 🔔 Unread notification
  PENDING_YOU: 'pending_you',   // ⏳ Your turn to respond
  PENDING_OTHER: 'pending_other', // ⏳ Waiting for response
  COMPLETED: 'completed'         // ✅ Marked complete
}
```

### Moments

**What:** Thematic units in the travel timeline (days, experiences, locations)

**Data structure:**
```javascript
{
  id: 'moment_1',
  title: 'Jour 1 : Arrivée à Luang Prabang',
  date: '2024-01-15',
  description: 'Premier jour...',
  photos: ['photo_1', 'photo_2'],
  posts: ['post_1'],
  location: 'Luang Prabang',
  tags: ['arrival', 'city'],
  linkedSessions: ['session_1', 'session_2']
}
```

### Content Links

**What:** Bidirectional links between content (moments/photos/posts) and sessions

**Managed by:** `ContentLinks.js`

**Structure:**
```javascript
{
  links: [
    {
      id: 'link_1',
      sessionId: 'session_1',
      contentType: 'moment', // 'moment' | 'photo' | 'post'
      contentId: 'moment_1',
      createdAt: '2025-11-10T12:00:00Z'
    }
  ]
}
```

**Indexes:** Two Map structures for O(1) lookups
- `sessionIndex`: sessionId → Set<linkIds>
- `contentIndex`: contentKey → Set<linkIds>

**Content key format:** `{contentType}:{contentId}`

### Theme Assignments

**What:** User-assigned theme tags for organizing content

**Managed by:** `ThemeAssignments.js`

**Themes:** `culture`, `food`, `nature`, `people`, `architecture`, etc.

---

## 🚀 Development Workflows

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Version Updates

**When releasing a new version:**

1. Update `/src/config/version.js`:
   ```javascript
   export const APP_VERSION = "2.7"; // Increment
   export const BUILD_DATE = "14 novembre 2025"; // Update date
   export const PHASE = "New Feature Name"; // Update phase
   ```

2. Document changes in `/Doc/dev_guide_v2_X.md`

3. Commit with clear message:
   ```bash
   git add .
   git commit -m "Version 2.7: New Feature Name"
   git push
   ```

### Deployment

**Platform:** Cloudflare Pages

**Configuration:** `wrangler.toml`
```toml
name = "mekong-memoire"
pages_build_output_dir = "dist"
```

**Process:**
1. `npm run build` - Creates `dist/` directory
2. Cloudflare Pages auto-deploys from git
3. Or manual: `npx wrangler pages deploy dist/`

### Debugging

**Enable debug mode:**
```javascript
// In browser console
localStorage.setItem('debug_mode', 'true');
// Then refresh
```

**Access managers:**
```javascript
// In browser console
window.dataManager.getState();
window.connectionManager.isConnected();
window.driveSync.listFiles();
```

**Useful debug commands:**
```javascript
// Check current state
window.dataManager.getState()

// Check localStorage
Object.keys(localStorage).filter(k => k.startsWith('mekong_'))

// Clear all data (caution!)
window.dataManager.resetAllData()
```

---

## ⚠️ Important Gotchas & Notes

### 1. No TypeScript

- Everything is JavaScript
- No type checking at build time
- Use JSDoc comments for better IDE support if needed

### 2. No Router Library

- Don't look for react-router or similar
- Navigation is state-based via `app.navigateTo()`
- Use `app.currentPage` to check current route

### 3. French Codebase

- All comments and documentation in French
- Variable names in English
- Function names in English
- Keep this convention when adding code

### 4. Singleton Managers

- All managers in `/src/core/` are singletons
- Export as `export const managerName = new Manager()`
- Never create new instances: ❌ `new DataManager()`
- Always import: ✅ `import { dataManager } from '../core/dataManager.js'`

### 5. State Updates

- **Never** mutate state directly
- Always go through `dataManager` methods
- State updates trigger pub/sub notifications
- React components re-render via `useAppState()`

### 6. Google OAuth Token

- Tokens expire after 1 hour
- Check `connectionManager.isConnected()` before Drive operations
- Token refresh happens automatically
- Handle disconnection gracefully (redirect to login)

### 7. Dark Mode Default

- App defaults to dark mode
- Always test both themes
- Use `dark:` classes consistently
- Never hardcode colors without dark variant

### 8. Mobile-First

- App is primarily mobile-focused
- Test on mobile viewport (375px width)
- Fixed top/bottom bars reduce usable height
- Always account for `pt-12 pb-16` padding

### 9. Performance

- Large photo collections can impact performance
- Use `useMemo` for expensive computations
- Avoid unnecessary re-renders
- ContentLinks uses Map for O(1) lookups

### 10. localStorage Limits

- Browser limit: ~5-10MB
- Monitor localStorage usage
- Critical data also synced to Google Drive
- Clear cache if hitting limits

---

## 🎯 Common Tasks

### Adding a New Page

1. Create component in `/src/components/pages/`:
   ```javascript
   // NewPage.jsx
   import React from 'react';
   import { useAppState } from '../../hooks/useAppState.js';

   function NewPage() {
     const app = useAppState();
     return (
       <div className="flex-1 bg-gray-50 dark:bg-gray-900">
         {/* Content */}
       </div>
     );
   }

   export default NewPage;
   ```

2. Add to routing in `/src/components/App.jsx`:
   ```javascript
   const renderPage = () => {
     switch (app.currentPage) {
       case 'new-page': return <NewPage />;
       // ... existing cases
     }
   }
   ```

3. Add navigation in `/src/components/Navigation.jsx`:
   ```javascript
   <button onClick={() => app.navigateTo('new-page')}>
     <Icon />
   </button>
   ```

### Adding a New Manager

1. Create in `/src/core/`:
   ```javascript
   // NewManager.js
   import { logger } from '../utils/logger.js';

   class NewManager {
     constructor() {
       this.data = null;
     }

     initialize() {
       logger.info('NewManager initialized');
     }
   }

   export const newManager = new NewManager();

   // Expose for debugging
   if (typeof window !== 'undefined') {
     window.newManager = newManager;
   }
   ```

2. Initialize in `/src/main.jsx`:
   ```javascript
   import { newManager } from './core/NewManager.js';
   newManager.initialize();
   ```

3. Add to `dataManager` dependencies if needed

### Adding Dark Mode to a Component

1. Import theme hook:
   ```javascript
   import { useTheme } from './ThemeContext.jsx';
   ```

2. Use in component:
   ```javascript
   function MyComponent() {
     const { theme, toggleTheme } = useTheme();

     return (
       <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
         Current theme: {theme}
         <button onClick={toggleTheme}>Toggle</button>
       </div>
     );
   }
   ```

3. Always provide both light and dark variants

### Adding a New Content Link

```javascript
import { contentLinks } from '../core/ContentLinks.js';

// Create link
contentLinks.addLink({
  sessionId: 'session_1',
  contentType: 'moment', // 'moment' | 'photo' | 'post'
  contentId: 'moment_1'
});

// Get links for session
const links = contentLinks.getLinksForSession('session_1');

// Get links for content
const links = contentLinks.getLinksForContent('moment', 'moment_1');

// Remove link
contentLinks.removeLink('link_id');
```

### Working with Sessions

```javascript
const app = useAppState();

// Create new session
const sessionId = app.createSession('Session Title', 'authorName');

// Add message to session
app.addMessage(sessionId, {
  author: 'userName',
  text: 'Message content',
  attachments: ['moment_1']
});

// Update session
app.updateSession(sessionId, {
  status: 'completed',
  themes: ['culture', 'food']
});

// Delete session
app.deleteSession(sessionId);
```

### Accessing Google Drive

```javascript
import { driveSync } from '../core/DriveSync.js';
import { connectionManager } from '../core/ConnectionManager.js';

// Check connection
if (!connectionManager.isConnected()) {
  // Handle disconnection
  return;
}

// Read file
const data = await driveSync.readFile('session_123.json');

// Write file
await driveSync.writeFile('session_123.json', sessionData);

// List files
const files = await driveSync.listFiles();

// Delete file
await driveSync.deleteFile('session_123.json');
```

---

## 📚 Additional Resources

### Documentation

- **Development Guides:** `/Doc/dev_guide_v2_*.md` (v2.2 → v2.7)
- **Phase Specs:** `/Doc/phase17_specs.md`
- **README:** `/README.md` (generic Vite template)

### Key Files to Review

**Before making changes, review:**
1. `/src/hooks/useAppState.js` - Main state hook
2. `/src/core/dataManager.js` - Central state manager
3. `/src/components/App.jsx` - Root component and routing
4. `/src/config/version.js` - Current version
5. Recent dev guide in `/Doc/`

### Useful Links

- **React Docs:** https://react.dev
- **Tailwind Docs:** https://tailwindcss.com/docs
- **Vite Docs:** https://vitejs.dev
- **Lucide Icons:** https://lucide.dev

---

## 🤝 Contributing Guidelines

### When Adding Features

1. **Check current version** in `/src/config/version.js`
2. **Review latest dev guide** in `/Doc/`
3. **Follow existing patterns** (pub/sub, singleton managers)
4. **Test both themes** (light and dark)
5. **Test on mobile** viewport
6. **Add French comments** for complex logic
7. **Update version** if releasing
8. **Document in** `/Doc/dev_guide_v2_X.md`

### Code Quality

- ✅ Use `useAppState()` for all state access
- ✅ Follow import organization pattern
- ✅ Provide dark mode variants for all UI
- ✅ Use custom logger instead of `console.log`
- ✅ Handle errors gracefully
- ✅ Check OAuth connection before Drive operations
- ❌ No direct state mutations
- ❌ No new manager instances (use singletons)
- ❌ No inline styles (use Tailwind)
- ❌ No hardcoded colors without dark variants

### Testing Checklist

Before committing:
- [ ] Runs without errors (`npm run dev`)
- [ ] Linter passes (`npm run lint`)
- [ ] Works in dark mode
- [ ] Works in light mode
- [ ] Responsive on mobile (375px)
- [ ] Google Drive sync works
- [ ] localStorage persists correctly
- [ ] Navigation flows work
- [ ] No console errors

---

## 🎓 Learning Path

**For new AI assistants working on this codebase:**

1. **Start with:** `/src/components/App.jsx` - Understand routing and structure
2. **Then read:** `/src/hooks/useAppState.js` - Learn state management
3. **Review:** `/src/core/dataManager.js` - Central state coordination
4. **Explore:** `/src/components/pages/` - See how pages work
5. **Check:** Recent `/Doc/dev_guide_v2_*.md` - Current phase goals
6. **Experiment:** Enable debug mode and explore via console

**Key mental models:**
- State flows: Component → `useAppState()` → `dataManager` → Managers → Storage
- Navigation: User action → `app.navigateTo()` → State change → Page re-render
- Data sync: User action → Manager → `driveSync` → Google Drive → Success callback

---

## 📞 Support

For questions about:
- **Architecture:** Review `/Doc/dev_guide_v2_*.md`
- **State management:** Check `/src/core/dataManager.js`
- **Routing:** See `/src/components/App.jsx`
- **Styling:** Review Tailwind patterns above
- **Data structures:** Check manager files in `/src/core/`

**Debug first:** Enable debug mode and check browser console and `window.dataManager.getState()`

---

**Last Updated:** November 14, 2025
**Version:** 2.6d "Dark Mode"
**Maintained by:** AI Assistants working on Mémoire du Mékong
