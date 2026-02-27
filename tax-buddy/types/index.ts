export type VisaType = 'F1' | 'J1' | 'OPT' | 'CPT' | 'H1B' | 'other';

export type IncomeType = 'W2' | 'stipend' | 'scholarship' | '1099' | 'TA' | 'RA' | 'fellowship';

export interface UserProfile {
  visaType: VisaType;
  countryOfOrigin: string;
  yearsInUS: number;
  stateOfResidence: string;
  incomeTypes: IncomeType[];
  ficaWithheld: boolean;
  tuitionPaid: number;
  scholarshipAmount: number;
}

export interface TaxCalculation {
  estimatedRefund: number;
  treatyBenefit: boolean;
  treatyCountry: string;
  ficaRefundEligible: boolean;
  ficaRefundAmount: number;
  formsNeeded: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type ChunkCategory = 'treaty' | 'fica' | 'forms' | 'residency' | 'income' | 'deadlines' | 'general';

export interface KnowledgeChunk {
  id: string;
  content: string;
  source: string;
  category: string;
  similarity?: number;
}
