import OpenAI from 'openai';
import { config } from '../config/env';
import { AIExtractionRequest, AIExtractionResponse, ExtractedPayment } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class AIService {
  private openai: OpenAI;
  private defaultInstructions: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
      timeout: 90000, // 90 seconds timeout
      maxRetries: 2,
    });

    this.defaultInstructions = `
Analyze this bank statement image and extract payment information for each row.
For each transaction, extract:
1. Amount from the AMOUNT column
2. Transaction reference from TRANSACTION REFERENCE NO column  
3. Student name and class from ACCOUNT NAME column
4. Parse ACCOUNT NAME as: [FirstName] [Class] [LastName] (e.g., "Liam G.2 Mbugua" = name: "Liam Mbugua", class: "Grade 2")

Look carefully as the text is handwritten. Return data as JSON array with this exact structure:
[
  {
    "amount": number,
    "transactionRef": "string",
    "studentName": "string", 
    "className": "string",
    "confidence": number (0-1)
  }
]

Only return the JSON array, no other text.
    `.trim();
  }

  public async extractPaymentData(request: AIExtractionRequest): Promise<AIExtractionResponse> {
    try {
      const instructions = request.customInstructions 
        ? `${this.defaultInstructions}\n\nAdditional Instructions: ${request.customInstructions}`
        : this.defaultInstructions;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // Updated to current model
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: instructions
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${request.imageBase64}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1, // Low temperature for consistent extraction
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI service');
      }

      // Parse the JSON response
      let extractedData: any[];
      try {
        // Clean the response to extract JSON
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('No JSON array found in AI response');
        }
        
        extractedData = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        throw new Error('Invalid JSON response from AI service');
      }

      // Validate and transform the data
      const payments: ExtractedPayment[] = extractedData.map((item, index) => {
        // Validate required fields
        if (!item.amount || !item.transactionRef || !item.studentName || !item.className) {
          // Skip incomplete data
        }

        return {
          id: uuidv4(),
          amount: this.parseAmount(item.amount),
          transactionRef: String(item.transactionRef || '').trim(),
          studentName: String(item.studentName || '').trim(),
          className: this.parseClassName(String(item.className || '').trim()),
          confidence: Math.min(Math.max(Number(item.confidence) || 0.5, 0), 1),
          isEdited: false
        };
      }).filter(payment => payment.amount > 0 && payment.transactionRef && payment.studentName);

      // Calculate overall confidence
      const overallConfidence = payments.length > 0 
        ? payments.reduce((sum, p) => sum + p.confidence, 0) / payments.length
        : 0;

      return {
        extractedData: payments,
        processingNotes: `Extracted ${payments.length} payment records from image`,
        confidence: overallConfidence
      };

    } catch (error) {
      console.error('AI extraction error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new Error('AI service rate limit exceeded. Please try again later.');
        }
        if (error.message.includes('insufficient_quota')) {
          throw new Error('AI service quota exceeded. Please contact administrator.');
        }
      }

      throw new Error('Failed to extract payment data from image');
    }
  }

  private parseAmount(amount: any): number {
    if (typeof amount === 'number') {
      return Math.abs(amount);
    }
    
    if (typeof amount === 'string') {
      // Remove currency symbols and commas
      const cleanAmount = amount.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleanAmount);
      return isNaN(parsed) ? 0 : Math.abs(parsed);
    }
    
    return 0;
  }

  private parseClassName(className: string): string {
    if (!className) return '';
    
    // Common class name patterns
    const patterns = [
      /G\.?(\d+)/i,           // G.2, G2
      /Grade\s*(\d+)/i,       // Grade 2, Grade2
      /Class\s*(\d+)/i,       // Class 2, Class2
      /Std\s*(\d+)/i,         // Std 2, Std2
      /(\d+)/                 // Just numbers
    ];

    for (const pattern of patterns) {
      const match = className.match(pattern);
      if (match) {
        return `Grade ${match[1]}`;
      }
    }

    // Return original if no pattern matches
    return className;
  }

  public async testConnection(): Promise<boolean> {
    try {
      const response = await this.openai.models.list();
      return response.data.length > 0;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  public async getUsage(): Promise<any> {
    try {
      // Note: OpenAI doesn't provide a direct usage endpoint in the current API
      // This would need to be implemented based on your billing/usage tracking needs
      return {
        message: 'Usage tracking not implemented - check OpenAI dashboard'
      };
    } catch (error) {
      console.error('Failed to get AI usage:', error);
      throw error;
    }
  }
}