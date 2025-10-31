import React from 'react';

const sectionTemplates = [
  {
    name: 'Hero Left',
    description: 'Headline, text, and a CTA button aligned to the left.',
    structure: { type: 'section', children: [{ type: 'row', children: [{ type: 'column', styles: { desktop: { flexBasis: '50%', justifyContent: 'center'} }, children: [ { type: 'headline', content: { level: 'h1', text: 'Powerful Headline' } }, { type: 'text', content: { text: 'Sub-heading to support the main headline and provide more context.' } }, { type: 'button', content: { text: 'Call to Action', href: '#' } } ] }, { type: 'column', styles: { desktop: { flexBasis: '50%'} }, children: [ { type: 'image', content: { src: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1974&auto=format&fit=crop', alt: 'Team working' } } ] }] }] },
  },
  {
    name: 'Features (3 Col)',
    description: 'Three columns with icons, headlines, and text.',
    structure: { type: 'section', children: [{ type: 'row', children: [ { type: 'column', styles: { desktop: { flexBasis: '33.33%', textAlign: 'center' } }, children: [ { type: 'icon', content: { name: 'star' } }, { type: 'headline', content: { level: 'h3', text: 'Feature One' } }, { type: 'text', content: { text: 'Describe the feature in a few sentences.' } } ] }, { type: 'column', styles: { desktop: { flexBasis: '33.33%', textAlign: 'center' } }, children: [ { type: 'icon', content: { name: 'check' } }, { type: 'headline', content: { level: 'h3', text: 'Feature Two' } }, { type: 'text', content: { text: 'Describe the feature in a few sentences.' } } ] }, { type: 'column', styles: { desktop: { flexBasis: '33.33%', textAlign: 'center' } }, children: [ { type: 'icon', content: { name: 'heart' } }, { type: 'headline', content: { level: 'h3', text: 'Feature Three' } }, { type: 'text', content: { text: 'Describe the feature in a few sentences.' } } ] } ] }] },
  },
   {
    name: 'Call to Action',
    description: 'A centered headline, text, and button to encourage action.',
    structure: { type: 'section', children: [{ type: 'row', children: [{ type: 'column', styles: { desktop: { textAlign: 'center', alignItems: 'center' } }, children: [ { type: 'headline', content: { level: 'h2', text: 'Ready to Get Started?' } }, { type: 'text', content: { text: 'Take the next step and see how we can help you achieve your goals.' } }, { type: 'button', content: { text: 'Sign Up Now', href: '#' } } ] }] }] },
  },
];


const SectionTemplatesPanel: React.FC<{ onAddSection: (context: 'page' | 'header' | 'footer') => void }> = ({ onAddSection }) => {
    return (
        <div className="p-4 space-y-4">
            {sectionTemplates.map(template => (
                <button 
                    key={template.name} 
                    className="w-full text-left p-3 border rounded-lg hover:bg-slate-50 hover:border-indigo-400"
                    onClick={() => onAddSection('page')} // Simplified: just adds a blank section for now
                >
                    <p className="font-semibold text-slate-800">{template.name}</p>
                    <p className="text-sm text-slate-500">{template.description}</p>
                </button>
            ))}
        </div>
    );
}

export default SectionTemplatesPanel;
