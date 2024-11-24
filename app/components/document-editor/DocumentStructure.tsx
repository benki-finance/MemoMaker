import { DOCUMENT_TEMPLATES } from '@/lib/constants';

interface DocumentStructureProps {
  templateType: string;
  onSectionSelect: (section: string) => void;
  currentSection: string;
}

export function DocumentStructure({ 
  templateType, 
  onSectionSelect, 
  currentSection 
}: DocumentStructureProps) {
  const template = DOCUMENT_TEMPLATES[templateType as keyof typeof DOCUMENT_TEMPLATES];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Document Structure</h3>
      <ul className="space-y-2">
        {template.sections.map((section) => (
          <li 
            key={section}
            className={`cursor-pointer p-2 rounded ${
              currentSection === section 
                ? 'bg-primary text-white' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => onSectionSelect(section)}
          >
            {section}
          </li>
        ))}
      </ul>
    </div>
  );
}