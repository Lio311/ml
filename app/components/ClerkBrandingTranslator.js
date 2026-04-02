'use client';

import { useEffect } from 'react';

/**
 * Translates Clerk "Secured by Clerk" branding text to Hebrew.
 * Uses MutationObserver to detect when Clerk modals appear.
 * 
 * Note: Close button positioning is handled via Clerk's appearance.elements 
 * prop in layout.js (modalCloseButton / cardBox).
 */
export default function ClerkBrandingTranslator() {
  useEffect(() => {
    function translateBranding(root) {
      if (!root) return;

      // --- Translate "Secured by" branding ---
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
        // Recurse into shadow roots
        if (el.shadowRoot) {
          translateBranding(el.shadowRoot);
        }
      });
    }

    function scanAndTranslate() {
      translateBranding(document);

      document.querySelectorAll('*').forEach(el => {
        if (el.shadowRoot) {
          translateBranding(el.shadowRoot);

          if (!el.hasAttribute('data-clerk-observed')) {
            el.setAttribute('data-clerk-observed', 'true');
            const shadowObserver = new MutationObserver(() => {
              translateBranding(el.shadowRoot);
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
    scanAndTranslate();

    // Observe document for new elements (Clerk modals opening)
    const observer = new MutationObserver(() => {
      scanAndTranslate();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
