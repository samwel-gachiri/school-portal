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
  class: number;
  stream?: number;
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

export interface User {
  user_id: number;
  username: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}