import React, { useRef, useEffect, useCallback } from 'react';

interface ContentEditableProps {
    html: string;
    onChange: (newHtml: string) => void;
    tagName?: string;
    className?: string;
    [key: string]: any; // for other props like style
}

const ContentEditable: React.FC<ContentEditableProps> = ({ html, onChange, tagName = 'div', className, ...props }) => {
    const elementRef = useRef<HTMLElement>(null);
    const lastHtml = useRef<string>(html);

    useEffect(() => {
        // Update the DOM if the html prop changes from outside (e.g., AI update, undo/redo)
        if (elementRef.current && html !== elementRef.current.innerHTML) {
            elementRef.current.innerHTML = html;
        }
        lastHtml.current = html;
    }, [html]);

    const handleInput = useCallback(() => {
        if (elementRef.current) {
            const newHtml = elementRef.current.innerHTML;
            if (newHtml !== lastHtml.current) {
                lastHtml.current = newHtml;
                onChange(newHtml);
            }
        }
    }, [onChange]);

    // BUGFIX: Sanitize pasted content to prevent style conflicts and broken HTML.
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    }, []);

    // FIX: Replaced JSX with dynamic tag with React.createElement to resolve JSX namespace and signature errors.
    return React.createElement(tagName, {
        ...props,
        ref: elementRef,
        className: className,
        contentEditable: true,
        suppressContentEditableWarning: true,
        onInput: handleInput,
        onPaste: handlePaste,
        dangerouslySetInnerHTML: { __html: html }
    });
};

export default React.memo(ContentEditable);
