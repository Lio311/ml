'use client';

import { useEffect } from 'react';

/**
 * Adjusts Clerk UI for Hebrew RTL:
 * 1. Translates "Secured by Clerk" branding text to Hebrew.
 * 2. Moves the close (X) button to the left side for RTL layout.
 * Uses MutationObserver to detect when Clerk modals appear,
 * including inside Shadow DOM.
 */
export default function ClerkBrandingTranslator() {
  useEffect(() => {
    function adjustClerkUI(root) {
      // --- 1. Translate branding ---
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
        if (el.children.length === 0 && el.textContent.trim() === 'Secured by') {
          el.textContent = 'מאובטח על ידי';
        }
      });


      // Note: Close button is hidden via ClerkProvider appearance.elements in layout.js

      // Recurse into shadow roots
      allElements.forEach(el => {
        if (el.shadowRoot) {
          adjustClerkUI(el.shadowRoot);
        }
      });
    }

    function scanAndAdjust() {
      adjustClerkUI(document);

      document.querySelectorAll('*').forEach(el => {
        if (el.shadowRoot) {
          adjustClerkUI(el.shadowRoot);

          const shadowObserver = new MutationObserver(() => {
            adjustClerkUI(el.shadowRoot);
          });
          shadowObserver.observe(el.shadowRoot, {
            childList: true,
            subtree: true,
            characterData: true,
          });
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
