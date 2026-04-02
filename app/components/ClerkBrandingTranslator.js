'use client';

import { useEffect } from 'react';

/**
 * Adjusts Clerk UI for Hebrew RTL:
 * 1. Translates "Secured by Clerk" branding text to Hebrew.
 * 2. Moves the close (X) button to the left side for RTL layout 
 *    using robust CSS injection into Shadow DOM.
 */
const CLERK_RTL_CSS = `
  .cl-modalCloseButton,
  button[aria-label^="Close"],
  button[aria-label^="סגור"] {
    left: 16px !important;
    right: auto !important;
    position: absolute !important;
  }
`;

export default function ClerkBrandingTranslator() {
  useEffect(() => {
    function injectShadowStyles(root) {
      // Create a style element if it doesn't exist in this shadow root
      if (!root.querySelector('style[data-antigravity-clerk]')) {
        const style = document.createElement('style');
        style.setAttribute('data-antigravity-clerk', 'true');
        style.textContent = CLERK_RTL_CSS;
        root.appendChild(style);
      }
    }

    function adjustClerkUI(root) {
      if (!root) return;

      // 1. If this is a ShadowRoot, inject our custom CSS
      if (root instanceof ShadowRoot) {
        injectShadowStyles(root);
      }

      // --- 2. Translate branding ---
      const links = root.querySelectorAll('a[href*="clerk"], a[aria-label*="Clerk"]');
      links.forEach(link => {
        if (link.textContent.includes('Secured by')) {
          const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
          let node;
          while ((node = walker.nextNode())) {
            if (node.textContent.includes('Secured by')) {
              node.textContent = node.textContent.replace('Secured by', 'מאובטח על ידי');
            }
          }
        }
      });

      const allElements = root.querySelectorAll('*');
      allElements.forEach(el => {
        // Direct text translation for simple elements
        if (el.children.length === 0 && el.textContent.trim() === 'Secured by') {
          el.textContent = 'מאובטח על ידי';
        }
        
        // --- 3. Recurse into Shadow Roots ---
        if (el.shadowRoot) {
          adjustClerkUI(el.shadowRoot);
        }
      });
    }

    function scanAndAdjust() {
      // Check the main document
      adjustClerkUI(document);

      // Search for any existing Shadow Roots that might have been missed
      document.querySelectorAll('*').forEach(el => {
        if (el.shadowRoot) {
          adjustClerkUI(el.shadowRoot);

          // Observe the shadow root for internal changes
          // We use a flag to avoid multiple observers on same shadow root
          if (!el.hasAttribute('data-clerk-observed')) {
            el.setAttribute('data-clerk-observed', 'true');
            const shadowObserver = new MutationObserver(() => {
              adjustClerkUI(el.shadowRoot);
            });
            shadowObserver.observe(el.shadowRoot, {
              childList: true,
              subtree: true,
              characterData: true,
            });
          }
        }
      });
    }

    // Initial scan
    scanAndAdjust();

    // Observe document for new elements (Clerk modals opening)
    const observer = new MutationObserver(() => {
      scanAndAdjust();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
