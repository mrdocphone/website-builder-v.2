// NOTE: This file exports the 'ElementRenderer' component, which renders individual website elements like headlines and text.
import React from 'react';
import type { Element as ElementType, HeadlineElement, TextElement, ImageElement, ButtonElement } from '../types';

interface ElementProps {
  element: ElementType;
}

const ElementRenderer: React.FC<ElementProps> = ({ element }) => {

  // CRITICAL FIX: A missing, null, or non-object `content` property on an element
  // from the database would cause a crash. This improved guard handles corrupted 
  // data gracefully by checking the type.
  if (!element.content || typeof element.content !== 'object') {
      return null;
  }
  
  switch (element.type) {
    case 'headline': {
      const { level, text } = element.content as HeadlineElement['content'];
      // FIX: Add validation for the 'level' property. If it's missing or invalid,
      // default to 'h2' to prevent a rendering crash.
      const Tag = (level && ['h1', 'h2', 'h3'].includes(level)) ? level : 'h2';
      return (
        <Tag>
          {text}
        </Tag>
      );
    }

    case 'text': {
      const { text } = element.content as TextElement['content'];
      return (
        <p className="whitespace-pre-wrap">
          {text}
        </p>
      );
    }

    case 'image': {
      const { src, alt } = element.content as ImageElement['content'];
      // An image without a source URL is invalid and should not be rendered.
      if (!src) {
        return null;
      }
      return <img src={src} alt={alt || ''} className="max-w-full h-auto" />;
    }

    case 'button': {
      const { text, href } = element.content as ButtonElement['content'];
       // A button without text or a link is invalid and should not be rendered.
      if (!text || !href) {
        return null;
      }
      return (
        <a 
          href={href} 
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md no-underline"
        >
          <span>
            {text}
          </span>
        </a>
      );
    }
      
    default:
      return null;
  }
};

export default React.memo(ElementRenderer);