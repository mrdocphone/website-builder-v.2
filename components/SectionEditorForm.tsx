// NOTE: This file exports the 'Element' component, which renders individual website elements like headlines and text.
import React from 'react';
import type { Element as ElementType, HeadlineElement, TextElement, ImageElement, ButtonElement } from '../types';

interface ElementProps {
  element: ElementType;
}

const Element: React.FC<ElementProps> = ({ element }) => {

  // CRITICAL FIX: A missing 'content' property on an element from the database
  // would cause a crash during render. This guard prevents the entire app from
  // failing to load by safely ignoring any corrupted element data.
  if (!element.content) {
      return null;
  }
  
  switch (element.type) {
    case 'headline':
      const { level, text } = element.content as HeadlineElement['content'];
      // FIX: Add validation for the 'level' property. If it's missing or invalid,
      // default to 'h2' to prevent a rendering crash.
      const Tag = (level && ['h1', 'h2', 'h3'].includes(level)) ? level : 'h2';
      return (
        <Tag>
          {text}
        </Tag>
      );

    case 'text':
      return (
        <p className="whitespace-pre-wrap">
          {(element.content as TextElement['content']).text}
        </p>
      );

    case 'image':
      const { src, alt } = element.content as ImageElement['content'];
      return <img src={src} alt={alt} className="max-w-full h-auto" />;

    case 'button':
      return (
        <a 
          href={(element.content as ButtonElement['content']).href} 
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md no-underline"
        >
          <span>
            {(element.content as ButtonElement['content']).text}
          </span>
        </a>
      );
      
    default:
      return null;
  }
};

export default React.memo(Element);