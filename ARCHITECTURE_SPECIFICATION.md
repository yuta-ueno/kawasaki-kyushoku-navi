# Architecture Specification - Kawasaki Kyushoku Navi

## Recent Changes and Architectural Updates

### Share Button Feature Implementation (2025-08-26)

#### Components Added
- **ShareButton Component** (`src/components/share/ShareButton.js`)
  - Modal trigger button with Share icon
  - State management for modal visibility
  - Integrated into header layout

- **ShareModal Component** (`src/components/share/ShareModal.js`)
  - Full-screen modal with clipboard functionality
  - Dual URL support (LINE and PC optimized)
  - Visual feedback for copy operations
  - Fallback clipboard implementation for older browsers

#### URL Architecture
- **LINE URL**: `https://link.kawasaki-kyushoku.jp`
  - Optimized for mobile/LINE sharing
  - Shorter domain for easier sharing
- **PC URL**: `https://kawasaki-kyushoku.jp`
  - Full desktop experience
  - Standard domain format

#### Header Layout Updates
- Share button positioned left of PWA button
- Responsive design for mobile and desktop
- Consistent spacing with existing UI elements

### PWA Button Text Optimization (2025-08-26)

#### UI Text Changes
- PWA button text updated from "ホームに追加" to "ホーム追加"
- Shortened for better mobile display
- Maintains accessibility with aria-label

### Previous UserAgent Detection Removal

#### Architectural Decisions
- Removed complex userAgent detection logic
- Simplified PWA button functionality
- Eliminated browser-specific conditional rendering
- Improved reliability across different environments

#### Components Cleaned
- `useInAppBrowserDetect` hook simplified
- Removed debugging displays from footer
- Restored original PWA installation flow

## Component Architecture

### Header Component Structure
```
Header.js
├── Logo/Title section
├── Date display (dynamic JST)
├── Notification bell (with unread indicator)
├── Share button (new - triggers modal)
├── PWA button (text updated)
└── District selector (conditional)
```

### Modal System
```
ShareButton.js → ShareModal.js
├── Overlay click handling
├── LINE URL section with copy button
├── PC URL section with copy button
├── Visual feedback system
└── Keyboard accessibility
```

### State Management
- Local component state for modal visibility
- Clipboard copy status tracking
- Error handling for clipboard operations

## Technical Implementation Details

### Clipboard API Integration
- Primary: Modern `navigator.clipboard.writeText()`
- Fallback: Legacy document.execCommand('copy')
- Visual feedback with temporary state changes

### Responsive Design
- Mobile-first approach
- Breakpoint-aware button positioning
- Consistent with existing Solarized color scheme

### Accessibility Features
- ARIA labels maintained
- Keyboard navigation support
- High contrast visual feedback
- Semantic HTML structure

## Build and Deployment

### Recent Deployments
- **Latest**: c188f36 - PWA button text optimization
- **Previous**: a68addb - Share button feature implementation
- **Vercel URL**: https://kawasaki-kyushoku-navi-jhvk79pw1-yutas-projects-fc6b6de6.vercel.app

### Sentry Integration
- Source map uploads configured
- Error tracking for new components
- Performance monitoring enabled

## Future Considerations

### Potential Enhancements
- Share button usage analytics
- Custom sharing messages
- Social media integration
- QR code generation for URLs

### Maintenance Notes
- Monitor clipboard API compatibility
- Track share button usage patterns
- Consider URL shortening service integration
- Review mobile UX feedback

---

*Last updated: 2025-08-26*
*Architecture maintained by: Claude Code Assistant*