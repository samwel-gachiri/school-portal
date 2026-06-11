export interface ExtractedPayment {
  id: string;
  amount: number;
  transactionRef: string;
  studentName: string;
  className: string;
  confidence: number;
  isEdited: boolean;
}

export interface StudentMatch {
  adm: number;
  name1: string;
  name2: string;
  name3?: string;
  class: number | string;
  classId?: number;
  stream?: number | string;
  streamId?: number;
  currentBalance: number;
  matchConfidence: number;
}

export interface PaymentRecord {
  extractedPayment: ExtractedPayment;
  matchedStudent?: StudentMatch;
  isMatched: boolean;
  newBalance: number;
  overpayment?: number;
  status: 'pending' | 'confirmed' | 'error';
}

export interface AIExtractionRequest {
  imageBase64: string;
  customInstructions?: string;
  documentType?: string;
}

export interface AIExtractionResponse {
  extractedData: ExtractedPayment[];
  processingNotes: string;
  confidence: number;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

export interface User {
  user_id: number;
  username: string;
  password: string;
}

export interface UserSession {
  session_id: string;
  user_id: number;
  created_at: Date;
  expires_at: Date;
  is_active: boolean;
}

export interface ProcessingLog {
  log_id: number;
  user_id: number;
  action_type: 'upload' | 'extract' | 'match' | 'confirm' | 'insert';
  details: any;
  timestamp: Date;
}