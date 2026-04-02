'use client';

import { useEffect } from 'react';

/**
 * Translates "Secured by Clerk" branding text to Hebrew.
 * Uses MutationObserver to detect when Clerk modals appear
 * and replaces the branding text, including inside Shadow DOM.
 */
export default function ClerkBrandingTranslator() {
  useEffect(() => {
    function translateBranding(root) {
      // Search in regular DOM
      const links = root.querySelectorAll('a[href*="clerk"], a[aria-label*="Clerk"]');
      links.forEach(link => {
        if (link.textContent.includes('Secured by')) {
          // Find the text node containing "Secured by" and replace it
          const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
          let node;
          while ((node = walker.nextNode())) {
            if (node.textContent.includes('Secured by')) {
              node.textContent = node.textContent.replace('Secured by', 'מאובטח על ידי');
            }
          }
        }
      });

      // Also search for any element containing the exact text
      const allElements = root.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.children.length === 0 && el.textContent.trim() === 'Secured by') {
          el.textContent = 'מאובטח על ידי';
        }
      });

      // Recurse into shadow roots
      allElements.forEach(el => {
        if (el.shadowRoot) {
          translateBranding(el.shadowRoot);
        }
      });
    }

    function scanAndTranslate() {
      translateBranding(document);

      // Also check all elements for shadow roots we might have missed
      document.querySelectorAll('*').forEach(el => {
        if (el.shadowRoot) {
          translateBranding(el.shadowRoot);

          // Observe shadow root for changes too
          const shadowObserver = new MutationObserver(() => {
            translateBranding(el.shadowRoot);
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
