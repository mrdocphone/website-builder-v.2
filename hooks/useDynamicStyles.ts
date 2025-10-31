import { useMemo } from 'react';
import type { WebsiteData, WebsiteNode, Page, Device } from '../types';

const camelToKebab = (str: string) => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

const generateStyles = (selector: string, styles: any): string => {
    if (!styles || Object.keys(styles).length === 0) return '';
    const styleString = Object.entries(styles)
        .map(([k, v]) => v ? `${camelToKebab(k)}: ${v};` : '')
        .join(' ');
    return `${selector} { ${styleString} }`;
};

const findNodesWithProperty = (nodes: WebsiteNode[], property: 'customCss' | 'hoverStyles'): any[] => {
    let results: any[] = [];
    if (!nodes) return results;
    for (const node of nodes) {
        if (!node) continue;
        if (node[property] && Object.keys(node[property]!).length > 0) {
            results.push({ id: node.id, [property]: node[property] });
        }
        if ('children' in node && Array.isArray(node.children)) {
            results = results.concat(findNodesWithProperty(node.children as WebsiteNode[], property));
        }
         // Handle tabs content
        if (node.type === 'tabs' && (node as any).content?.items) {
             for (const item of (node as any).content.items) {
                if (item.content) {
                    results = results.concat(findNodesWithProperty(item.content, property));
                }
            }
        }
    }
    return results;
};


export const useDynamicStyles = (websiteData: WebsiteData | null, activePage: Page | null) => {
    return useMemo(() => {
        if (!websiteData) return '';
        
        let css = '';

        // 1. Global Color Variables
        const colors = websiteData.globalStyles?.colors || [];
        if (colors.length > 0) {
            const colorVars = colors.map(c => `--${c.name.toLowerCase().replace(/\s+/g, '-')}: ${c.value};`).join('\n');
            css += `:root { ${colorVars} }\n`;
        }

        const allNodes = [
            ...websiteData.header,
            ...(activePage ? activePage.children : []),
            ...websiteData.footer,
        ];
        
        // 2. Custom CSS per element
        const customCssNodes = findNodesWithProperty(allNodes, 'customCss');
        customCssNodes.forEach(node => {
            if (node.customCss) {
                // Replace "selector" with the actual node selector
                const scopedCss = node.customCss.replace(/selector/g, `[data-node-id="${node.id}"]`);
                css += `${scopedCss}\n`;
            }
        });

        // 3. Hover Styles
        const hoverNodes = findNodesWithProperty(allNodes, 'hoverStyles');
        const hoverStyles: Record<Device, string[]> = { desktop: [], tablet: [], mobile: [] };
        
        hoverNodes.forEach(({ id, hoverStyles: hs }) => {
            if (hs.desktop) hoverStyles.desktop.push(generateStyles(`[data-node-id="${id}"]:hover`, hs.desktop));
            if (hs.tablet) hoverStyles.tablet.push(generateStyles(`[data-node-id="${id}"]:hover`, hs.tablet));
            if (hs.mobile) hoverStyles.mobile.push(generateStyles(`[data-node-id="${id}"]:hover`, hs.mobile));
        });
        
        css += hoverStyles.desktop.join('\n');
        if (hoverStyles.tablet.length > 0) {
            css += `\n@media (max-width: 768px) { ${hoverStyles.tablet.join('\n')} }\n`;
        }
        if (hoverStyles.mobile.length > 0) {
            css += `\n@media (max-width: 480px) { ${hoverStyles.mobile.join('\n')} }\n`;
        }

        return css;

    }, [websiteData, activePage]);
};
