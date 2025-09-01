# Task Completion Checklist

## Before Completing Any Task
1. Run linting: `npm run lint`
2. Test build: `npm run build`
3. Check for TypeScript errors (if applicable)
4. Test functionality in development mode
5. Review code for security issues (no hardcoded secrets, proper validation)

## For Firebase Changes
1. Test with Firebase emulators if available
2. Validate Firestore security rules
3. Check environment variable configuration

## For API Changes  
1. Test rate limiting functionality
2. Validate CORS configuration
3. Test error handling scenarios
4. Verify input validation with Zod schemas

## For UI Changes
1. Test responsive design (mobile, tablet, desktop)
2. Verify accessibility (ARIA labels, semantic HTML)
3. Test with different color schemes
4. Check loading and error states