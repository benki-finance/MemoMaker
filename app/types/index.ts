export interface Advisor {
    id: string;
    name: string;
    description: string;
    icon: string;
  }
  
  export interface Template {
    id: string;
    name: string;
    description: string;
    icon: string;
  }
  
  export interface DocumentSection {
    id: string;
    title: string;
    content: string;
    subsections: string[];
  }