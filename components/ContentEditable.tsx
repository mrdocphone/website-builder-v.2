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

    // This effect handles updates from the parent component (e.g., undo/redo, AI changes)
    // It's the "downward" data flow from the application's state to the DOM.
    useEffect(() => {
        if (elementRef.current && html !== elementRef.current.innerHTML) {
            elementRef.current.innerHTML = html;
        }
    }, [html]);

    // This callback handles user input inside the component. It's the "upward" data flow.
    // It compares the live DOM content with the last known state from props.
    const handleInput = useCallback(() => {
        if (elementRef.current) {
            const newHtml = elementRef.current.innerHTML;
            if (newHtml !== html) {
                onChange(newHtml);
            }
        }
    }, [onChange, html]); // Dependency on `html` is crucial for comparing against the correct state.

    // BUGFIX: Sanitize pasted content to prevent style conflicts and broken HTML.
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    }, []);
    
    // FIX: Intercept the Enter key to enforce consistent line breaks, but allow default behavior for lists.
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                let container = selection.getRangeAt(0).commonAncestorContainer;
                // Traverse up the DOM to see if we are inside an LI tag
                while (container && container.nodeName !== 'BODY') {
                    if (container.nodeName === 'LI') {
                        return; // Allow default behavior for lists
                    }
                    container = container.parentNode!;
                }
            }
            // If not in a list, enforce consistent line breaks
            e.preventDefault();
            document.execCommand('insertHTML', false, '<br><br>');
        }
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
        onKeyDown: handleKeyDown,
        dangerouslySetInnerHTML: { __html: html }
    });
};

export default React.memo(ContentEditable);
