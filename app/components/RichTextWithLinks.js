"use client";

import React from 'react';
import Link from 'next/link';

// Define the keywords we want to automatically link
// You can add more fragrance notes or categories here
const LINKABLE_KEYWORDS = [
  'וניל',
  'עצי',
  'פירותי',
  'מאסק',
  'הדרים',
  'פרחוני',
  'מתוק',
  'רענן',
  'פצ\'ולי',
  'ענבר',
  'אמבר',
  'תבלינים',
  'טבק',
  'קיץ',
  'חורף',
  'ערב'
];

export default function RichTextWithLinks({ text, className = "" }) {
  if (!text) return null;

  // Create a regex to match any of the keywords
  // Word boundaries in Hebrew can be tricky, so we use spaces/punctuation as boundaries
  const regexPattern = new RegExp(`(^|[\\s.,!?;:])(${LINKABLE_KEYWORDS.join('|')})([\\s.,!?;:]|$)`, 'gi');

  const processText = (inputText) => {
    // We need to split the string and interleave React components.
    // However, JS replace with a function doesn't return React elements easily.
    // Instead, we can split by the regex, capturing the matched groups.
    const parts = [];
    let lastIndex = 0;
    
    // We'll use matchAll to find all occurrences and their indices
    const matches = [...inputText.matchAll(regexPattern)];
    
    if (matches.length === 0) {
      return <span>{inputText}</span>;
    }

    matches.forEach((match, index) => {
      const fullMatch = match[0];
      const prefix = match[1]; // before the keyword
      const keyword = match[2]; // the actual keyword
      const suffix = match[3]; // after the keyword
      
      const matchIndex = match.index;
      
      // Add text before the match
      if (matchIndex > lastIndex) {
        parts.push(<span key={`text-${index}`}>{inputText.substring(lastIndex, matchIndex)}</span>);
      }
      
      // Add the prefix
      if (prefix) {
        parts.push(<span key={`prefix-${index}`}>{prefix}</span>);
      }
      
      // Add the link
      parts.push(
        <Link 
          key={`link-${index}`} 
          href={`/catalog?q=${encodeURIComponent(keyword)}`}
          className="text-blue-600 hover:text-blue-800 underline decoration-1 underline-offset-4 transition-colors font-semibold"
          title={`חפש עוד בשמים בסגנון ${keyword}`}
        >
          {keyword}
        </Link>
      );
      
      // Add the suffix (note: the suffix might be the prefix of the NEXT match if they overlap, 
      // but regex execution handles this by consuming it. However, if they are adjacent e.g. "וניל, מאסק", 
      // the space after the comma might cause issues. 
      // A better approach for overlapping is splitting by keyword.
      if (suffix) {
        parts.push(<span key={`suffix-${index}`}>{suffix}</span>);
      }
      
      lastIndex = matchIndex + fullMatch.length;
    });
    
    // Add any remaining text
    if (lastIndex < inputText.length) {
      parts.push(<span key="text-end">{inputText.substring(lastIndex)}</span>);
    }
    
    return <>{parts}</>;
  };

  // If text contains HTML tags (e.g. <br>), we need to handle them or just assume it's plain text.
  // The product description usually contains \n which we should map to <br>
  const lines = text.split('\n');

  return (
    <div className={className}>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {processText(line)}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
}
