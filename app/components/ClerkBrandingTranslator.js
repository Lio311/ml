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

      // --- 2. Move close button to left side ---
      const closeButtons = root.querySelectorAll('button[aria-label="Close"], button[aria-label="סגור"]');
      closeButtons.forEach(btn => {
        const style = getComputedStyle(btn);
        // Only move if it's positioned on the right side
        if (style.position === 'absolute' || style.position === 'fixed') {
          btn.style.right = 'unset';
          btn.style.left = '16px';
        }
      });

      // Also look for close buttons by their typical Clerk class patterns
      const allButtons = root.querySelectorAll('button');
      allButtons.forEach(btn => {
        // Clerk close buttons typically contain only an X/close SVG icon
        // and are positioned absolutely in the top-right corner
        const svg = btn.querySelector('svg');
        if (svg && btn.childElementCount === 1) {
          const style = getComputedStyle(btn);
          const rect = btn.getBoundingClientRect();
          const parentRect = btn.offsetParent?.getBoundingClientRect();
          
          // Check if this button is in the top-right area (likely a close button)
          if (parentRect && (style.position === 'absolute' || style.position === 'fixed')) {
            const isTopRight = (rect.right - parentRect.right) > -50 && (rect.top - parentRect.top) < 50;
            if (isTopRight) {
              btn.style.right = 'unset';
              btn.style.left = '16px';
            }
          }
        }
      });

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
