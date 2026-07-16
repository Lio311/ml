# Cookie Consent Design

## Context
A premium, mobile-responsive cookie consent banner with multi-language support (Hebrew/English) and integration with localStorage so it doesn't show again once accepted.

## Selected Approach
A floating card in the bottom-left corner (for LTR/English) or bottom-right corner (for RTL/Hebrew).
This approach is modern, doesn't block the user's primary viewing area, and integrates smoothly with GSAP animations.

## Architecture
- **Component**: `CookieConsent.js` in `app/components/` or `app/components/ui/`
- **Context**: Uses `useLanguage()` from `LanguageContext.js` for translations.
- **State**: Uses React state and `localStorage` to check if `cookieConsentAccepted` is true.
- **Animation**: GSAP for a smooth entry animation (slide up + fade in) and exit animation upon clicking accept.
- **Styling**: TailwindCSS, Shadcn-like clean aesthetic (rounded corners, dark premium theme, crisp typography).

## Content
**Hebrew:**
"אנו משתמשים בקבצי קוקיז לצורך שיפור חוויית הגלישה, לצרכי שיווק והתאמת תכנים ובקרה. לקריאה נוספת אנא כנסו למדיניות הפרטיות של האתר."
Button: "אישור וסגירה"
Link: "לקריאת מדיניות" -> `/privacy`

**English:**
"We use cookies to improve your browsing experience, for marketing, personalized content, and analytics. For more information, please read our Privacy Policy."
Button: "Accept & Close"
Link: "Read Policy" -> `/privacy`

## Edge Cases handled
- Server-side rendering (SSR) mismatch: The component will only render/check localStorage after the initial client-side mount (`useEffect`).
- Z-index: Will ensure it sits above other floating elements but below critical modals (`z-50`).
- Mobile: On mobile screens, the card will take up most of the width (`w-[calc(100%-2rem)]` with `mx-4`) and sit just above the bottom edge.
