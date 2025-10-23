import React, { useRef, useEffect } from 'react';
import type { Element as ElementType, HeadlineElement, TextElement, ImageElement, ButtonElement } from '../types';

interface ElementProps {
  element: ElementType;
  isEditor: boolean;
  onContentChange: (newContent: any) => void;
}

const Element: React.FC<ElementProps> = ({ element, isEditor, onContentChange }) => {
  const contentRef = useRef<HTMLElement>(null);
  
  // For inline text editing
  const handleBlur = () => {
    if (!contentRef.current) return;
    const newText = contentRef.current.innerText;
    if (newText !== (element.content as any).text) {
      onContentChange({ ...element.content, text: newText });
    }
  };
  
  // Enable content editable only in editor mode and for text-based elements
  const isEditable = isEditor && (element.type === 'headline' || element.type === 'text' || element.type === 'button');

  useEffect(() => {
    // Sync innerText if external data changes, to prevent stale content
    if (contentRef.current && (element.type === 'headline' || element.type === 'text' || element.type === 'button')) {
      if (contentRef.current.innerText !== element.content.text) {
          contentRef.current.innerText = element.content.text;
      }
    }
  }, [element.content.text]);


  switch (element.type) {
    case 'headline':
      const { level, text } = element.content as HeadlineElement['content'];
      const Tag = level;
      return (
        <Tag
          ref={contentRef as any}
          contentEditable={isEditable}
          suppressContentEditableWarning={true}
          onBlur={handleBlur}
          className="outline-none"
        >
          {text}
        </Tag>
      );

    case 'text':
      return (
        <p
          ref={contentRef}
          contentEditable={isEditable}
          suppressContentEditableWarning={true}
          onBlur={handleBlur}
          className="outline-none whitespace-pre-wrap"
        >
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
          onClick={(e) => isEditor && e.preventDefault()}
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md no-underline"
        >
          <span
            ref={contentRef as any}
            contentEditable={isEditable}
            suppressContentEditableWarning={true}
            onBlur={handleBlur}
            className="outline-none"
          >
            {(element.content as ButtonElement['content']).text}
          </span>
        </a>
      );
      
    default:
      return null;
  }
};

export default React.memo(Element);
