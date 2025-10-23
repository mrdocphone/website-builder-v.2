import React from 'react';
import type { WebsiteData, ThemeConfig, Theme, Section } from '../types';
import { LocationMarkerIcon, MailIcon, PhoneIcon } from './icons';

interface PreviewProps {
  websiteData: WebsiteData;
  selectedSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
}

const themeConfigs: Record<Theme, ThemeConfig> = {
  light: {
    bg: 'bg-white',
    text: 'text-slate-700',
    primary: 'bg-indigo-600',
    primaryText: 'text-white',
    secondary: 'bg-slate-50',
    footerBg: 'bg-slate-800',
    footerText: 'text-slate-200',
    headerText: 'text-slate-800',
  },
  dark: {
    bg: 'bg-gray-800',
    text: 'text-gray-200',
    primary: 'bg-indigo-500',
    primaryText: 'text-white',
    secondary: 'bg-gray-700',
    footerBg: 'bg-black',
    footerText: 'text-gray-300',
    headerText: 'text-white',
  },
  ocean: {
    bg: 'bg-blue-50',
    text: 'text-blue-900',
    primary: 'bg-blue-600',
    primaryText: 'text-white',
    secondary: 'bg-blue-100',
    footerBg: 'bg-blue-900',
    footerText: 'text-blue-100',
    headerText: 'text-blue-900',
  },
  forest: {
    bg: 'bg-green-50',
    text: 'text-green-900',
    primary: 'bg-green-700',
    primaryText: 'text-white',
    secondary: 'bg-green-100',
    footerBg: 'bg-green-900',
    footerText: 'text-green-100',
    headerText: 'text-green-900',
  },
};

// Individual Section Components
const AboutSection: React.FC<{ section: Extract<Section, { type: 'about' }>, theme: ThemeConfig }> = ({ section, theme }) => (
    <section className="py-16 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
            <h3 className={`text-3xl font-bold text-center mb-8 ${theme.headerText}`}>{section.content.title}</h3>
            <p className="text-lg leading-relaxed whitespace-pre-wrap">{section.content.body}</p>
        </div>
    </section>
);

const ServicesSection: React.FC<{ section: Extract<Section, { type: 'services' }>, theme: ThemeConfig }> = ({ section, theme }) => (
    <section className={`py-16 px-6 md:px-12 ${theme.secondary}`}>
        <div className="max-w-4xl mx-auto">
            <h3 className={`text-3xl font-bold text-center mb-10 ${theme.headerText}`}>{section.content.title}</h3>
            <div className="grid md:grid-cols-3 gap-8">
                {section.content.services.map((service) => (
                    <div key={service.id} className="text-center p-6 bg-white rounded-lg shadow-md">
                        <h4 className={`font-semibold text-lg mb-2 ${theme.headerText}`}>{service.name}</h4>
                        <p>{service.description}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const GallerySection: React.FC<{ section: Extract<Section, { type: 'gallery' }>, theme: ThemeConfig }> = ({ section, theme }) => (
    <section className="py-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
            <h3 className={`text-3xl font-bold text-center mb-10 ${theme.headerText}`}>{section.content.title}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                 {section.content.images.map((image) => (
                    <img key={image.id} src={image.url} alt={image.alt} className="w-full h-full object-cover rounded-lg shadow-md" />
                 ))}
            </div>
        </div>
    </section>
);

const TestimonialsSection: React.FC<{ section: Extract<Section, { type: 'testimonials' }>, theme: ThemeConfig }> = ({ section, theme }) => (
     <section className={`py-16 px-6 md:px-12 ${theme.secondary}`}>
        <div className="max-w-4xl mx-auto">
            <h3 className={`text-3xl font-bold text-center mb-10 ${theme.headerText}`}>{section.content.title}</h3>
            <div className="grid md:grid-cols-2 gap-8">
                {section.content.testimonials.map((testimonial) => (
                    <blockquote key={testimonial.id} className="p-6 bg-white rounded-lg shadow-md">
                        <p className="italic">"{testimonial.quote}"</p>
                        <footer className={`mt-4 font-semibold text-right ${theme.headerText}`}>- {testimonial.author}</footer>
                    </blockquote>
                ))}
            </div>
        </div>
    </section>
);

const ContactSection: React.FC<{ section: Extract<Section, { type: 'contact' }>, theme: ThemeConfig }> = ({ section, theme }) => (
    <section className={`py-16 px-6 md:px-12 ${theme.secondary}`}>
        <div className="max-w-4xl mx-auto">
            <h3 className={`text-3xl font-bold text-center mb-10 ${theme.headerText}`}>{section.content.title}</h3>
            <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="flex flex-col items-center">
                    <LocationMarkerIcon className={`w-10 h-10 mb-3 ${theme.text}`} />
                    <h4 className="font-semibold text-lg">Address</h4>
                    <p className="mt-1">{section.content.address}</p>
                </div>
                <div className="flex flex-col items-center">
                    <PhoneIcon className={`w-10 h-10 mb-3 ${theme.text}`} />
                    <h4 className="font-semibold text-lg">Phone</h4>
                    <p className="mt-1">{section.content.phone}</p>
                </div>
                <div className="flex flex-col items-center">
                    <MailIcon className={`w-10 h-10 mb-3 ${theme.text}`} />
                    <h4 className="font-semibold text-lg">Email</h4>
                    <p className="mt-1">{section.content.email}</p>
                </div>
            </div>
        </div>
    </section>
);


const Preview: React.FC<PreviewProps> = ({ websiteData, selectedSectionId, onSelectSection }) => {
  const theme = themeConfigs[websiteData.theme] || themeConfigs.light;

  const renderSection = (section: Section) => {
    switch (section.type) {
      case 'about': return <AboutSection section={section} theme={theme} />;
      case 'services': return <ServicesSection section={section} theme={theme} />;
      case 'gallery': return <GallerySection section={section} theme={theme} />;
      case 'testimonials': return <TestimonialsSection section={section} theme={theme} />;
      case 'contact': return <ContactSection section={section} theme={theme} />;
      default: return null;
    }
  };

  return (
    <div className={`w-full h-full overflow-y-auto ${theme.bg} ${theme.text} transition-colors duration-300`}>
      {/* Header */}
      <header className={`p-6 sticky top-0 ${theme.bg} bg-opacity-80 backdrop-blur-sm z-10`}>
        <h1 className={`text-2xl font-bold ${theme.headerText}`}>{websiteData.businessName}</h1>
      </header>

      {/* Hero Section */}
      <section className="relative h-72">
        <img src={websiteData.heroImageUrl} alt={`${websiteData.businessName} hero image`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-white">{websiteData.businessName}</h2>
            <p className="mt-2 text-lg text-slate-200">{websiteData.tagline}</p>
          </div>
        </div>
      </section>

      {/* Dynamic Sections */}
      <main>
        {websiteData.sections.map(section => {
            const isSelected = section.id === selectedSectionId;
            return (
              <div 
                key={section.id} 
                className={`preview-section-wrapper ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectSection(section.id)}
              >
                  <div className="edit-overlay"></div>
                  <div className="edit-badge">Editing</div>
                  {renderSection(section)}
              </div>
            )
        })}
      </main>

      {/* Footer */}
      <footer className={`py-6 px-6 text-center ${theme.footerBg} ${theme.footerText}`}>
        <p>&copy; {new Date().getFullYear()} {websiteData.businessName}. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default React.memo(Preview);