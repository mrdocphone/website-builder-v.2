

import React from 'react';
// FIX: Replaced non-existent `Styles` type with `StyleProperties`.
import type { StyleProperties } from '../types';

interface StylePanelProps {
    styles: StyleProperties;
    onStyleChange: (property: keyof StyleProperties, value: string) => void;
}

const StyleInput: React.FC<{
    label: string;
    property: keyof StyleProperties;
    value: string | undefined;
    onChange: (property: keyof StyleProperties, value: string) => void;
    type?: string;
    options?: { value: string, label: string }[];
}> = ({ label, property, value, onChange, type = 'text', options }) => (
    <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-slate-600">{label}</label>
        {type === 'select' ? (
            <select
                value={value || ''}
                onChange={(e) => onChange(property, e.target.value)}
                className="w-2/3 p-1 border border-slate-300 rounded-md text-sm"
            >
                {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        ) : (
            <input
                type={type}
                value={value || ''}
                onChange={(e) => onChange(property, e.target.value)}
                className="w-2/3 p-1 border border-slate-300 rounded-md text-sm"
            />
        )}
    </div>
);


const StylePanel: React.FC<StylePanelProps> = ({ styles, onStyleChange }) => {
    return (
        <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-sm text-slate-600">Styling</h4>
            <div className="space-y-4">
                <div>
                    <h5 className="text-xs font-bold text-slate-500 mb-1">Spacing</h5>
                    <StyleInput label="Padding Top" property="paddingTop" value={styles.paddingTop} onChange={onStyleChange} />
                    <StyleInput label="Padding Bottom" property="paddingBottom" value={styles.paddingBottom} onChange={onStyleChange} />
                </div>
                 <div>
                    <h5 className="text-xs font-bold text-slate-500 mb-1">Appearance</h5>
                    <StyleInput label="Background" property="backgroundColor" type="color" value={styles.backgroundColor} onChange={onStyleChange} />
                </div>
                 <div>
                    <h5 className="text-xs font-bold text-slate-500 mb-1">Typography</h5>
                    <StyleInput label="Color" property="color" type="color" value={styles.color} onChange={onStyleChange} />
                     <StyleInput label="Align" property="textAlign" type="select" options={[{value: 'left', label: 'Left'}, {value: 'center', label: 'Center'}, {value: 'right', label: 'Right'}]} value={styles.textAlign} onChange={onStyleChange} />
                </div>
            </div>
        </div>
    );
};

export default StylePanel;