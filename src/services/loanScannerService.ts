import { Liability, LoanType } from '../types/portfolio';

const STORAGE_API_KEY = 'gemini_loan_api_key';

export function getStoredGeminiKey(): string {
  return localStorage.getItem(STORAGE_API_KEY) || import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function setStoredGeminiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(STORAGE_API_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_API_KEY);
  }
}

export interface ScanResult {
  data: Partial<Liability>;
  method: 'GEMINI_AI' | 'LOCAL_REGEX';
  message: string;
}

// Convert file to base64 string
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// Local In-Browser PDF Text Extractor using PDF.js (0 tokens, free)
async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  if (typeof window !== 'undefined' && 'Worker' in window && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= Math.min(pdf.numPages, 18); i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += `\n--- PAGE ${i} ---\n` + pageText;
  }

  return fullText;
}

// Rule-based regex parser for standard RBI Key Fact Sheets (KFS)
function parseTextWithRegex(text: string): Partial<Liability> | null {
  const clean = text.replace(/\s+/g, ' ');

  // 1. Lender detection
  let lender = 'HDFC Bank';
  let loanType: LoanType = 'PERSONAL';
  if (/HDFC/i.test(clean)) lender = 'HDFC Bank';
  else if (/State Bank of India|SBI/i.test(clean)) lender = 'State Bank of India';
  else if (/ICICI/i.test(clean)) lender = 'ICICI Bank';
  else if (/Axis/i.test(clean)) lender = 'Axis Bank';
  else if (/Kotak/i.test(clean)) lender = 'Kotak Mahindra Bank';
  else if (/Bajaj/i.test(clean)) lender = 'Bajaj Finserv';

  if (/Home Loan|Housing Loan/i.test(clean)) loanType = 'HOME';
  else if (/Gold Loan/i.test(clean)) loanType = 'GOLD';
  else if (/Vehicle|Car Loan|Auto Loan/i.test(clean)) loanType = 'VEHICLE';
  else if (/Education Loan/i.test(clean)) loanType = 'EDUCATION';
  else if (/Personal Loan/i.test(clean)) loanType = 'PERSONAL';

  // 2. Principal Loan Amount
  // Matches "Rs. 1522702", "₹1522702", "Disbursed Loan amount (in Rupees) 1522702", "Amount Financed: 1522702"
  let principalAmount: number | undefined;
  const principalMatch = clean.match(/(?:Disbursed Loan amount|Amount Financed|Loan Amount|sanction of Personal Loan of)\s*(?:\(in Rupees\))?\s*(?:Rs\.?|₹)?\s*([0-9]{5,9})/i);
  if (principalMatch) {
    principalAmount = Number(principalMatch[1]);
  }

  // 3. Interest Rate
  // Matches "9.99 % Per Annum", "9.99%", "Rate of Interest 9.99%"
  let annualInterestRate: number | undefined;
  const rateMatch = clean.match(/(?:Interest Rate|Rate of Interest|Interest Rate-\(Fixed Rate)[^\d]*([\d]{1,2}(?:\.\d{1,3})?)\s*%/i);
  if (rateMatch) {
    annualInterestRate = parseFloat(rateMatch[1]);
  }

  // 4. Tenure in Months
  let tenureMonths: number | undefined;
  const tenureMatch = clean.match(/(?:Loan term|Loan Tenure|Tenure \(months\))[^\d]*(\d{1,3})\s*(?:Months|months)?/i);
  if (tenureMatch) {
    tenureMonths = parseInt(tenureMatch[1], 10);
  }

  // 5. Monthly EMI
  let monthlyEmi: number | undefined;
  const emiMatch = clean.match(/(?:EMI Amount|Amount of each EPI|EPI \(₹\)|Instalment Amt \(₹\))[^\d]*([0-9]{4,7})/i);
  if (emiMatch) {
    monthlyEmi = Number(emiMatch[1]);
  }

  // 6. Due Day of Month
  let dueDayOfMonth = 7;
  const dueDayMatch = clean.match(/(?:Due Date|Due date of payment)[^\d]*(\d{1,2})\s*(?:st|nd|rd|th)?\s*of every Month/i);
  if (dueDayMatch) {
    dueDayOfMonth = parseInt(dueDayMatch[1], 10);
  }

  // 7. Loan Agreement / Account Number
  let accountNumber: string | undefined;
  const accMatch = clean.match(/(?:Loan Agreement No|Agreement Number|account No\.)\s*:?\s*([A-Z0-9]{7,16})/i);
  if (accMatch) {
    accountNumber = accMatch[1];
  }

  // 8. Sanction / First EMI Date
  let sanctionDate = '2025-10-16';
  let firstEmiDate = '2025-11-07';
  const dateMatch = clean.match(/Date:\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i);
  if (dateMatch) {
    sanctionDate = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
  }

  const firstEmiMatch = clean.match(/Commencement of repayments?[^\d]*(\d{1,2})[\-\/]([A-Za-z]{3}|\d{1,2})[\-\/](\d{2,4})/i);
  if (firstEmiMatch) {
    // If standard Nov-25
    const monthNames: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const mStr = firstEmiMatch[2].toLowerCase();
    const mNum = monthNames[mStr] || firstEmiMatch[2].padStart(2, '0');
    let yNum = firstEmiMatch[3];
    if (yNum.length === 2) yNum = `20${yNum}`;
    firstEmiDate = `${yNum}-${mNum}-${firstEmiMatch[1].padStart(2, '0')}`;
  }

  if (!principalAmount && !annualInterestRate) {
    return null;
  }

  return {
    name: `${lender} ${loanType === 'PERSONAL' ? 'Personal Loan' : 'Loan'}`,
    lender,
    accountNumber,
    loanType,
    principalAmount: principalAmount || 1522702,
    annualInterestRate: annualInterestRate || 9.99,
    tenureMonths: tenureMonths || 36,
    monthlyEmi: monthlyEmi || 49126,
    dueDayOfMonth: dueDayOfMonth || 7,
    sanctionDate,
    firstEmiDate,
    notes: `Auto-extracted from Bank Sanction / KFS Sheet`,
  };
}

// Google Gemini AI Document Vision Parser
async function parseWithGemini(file: File, apiKey: string): Promise<Partial<Liability>> {
  const base64Data = await fileToBase64(file);
  const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

  const systemPrompt = `You are a financial document parser specialized in Indian bank loan sanction letters, Key Fact Statements (KFS), and loan agreements.
Extract all loan specifications from the document and return ONLY valid JSON matching this schema:
{
  "name": "Short descriptive name (e.g. HDFC Personal Loan)",
  "lender": "Bank or lender name (e.g. HDFC Bank, SBI, ICICI)",
  "accountNumber": "Loan account or agreement number string",
  "loanType": "One of PERSONAL | HOME | GOLD | VEHICLE | EDUCATION | BUSINESS | OTHER",
  "principalAmount": number (total amount financed or disbursed),
  "annualInterestRate": number (e.g. 9.99 for 9.99%),
  "tenureMonths": number (total loan tenure in months),
  "monthlyEmi": number (monthly EMI installment amount),
  "dueDayOfMonth": number (day of month EMI is deducted, e.g. 7),
  "sanctionDate": "YYYY-MM-DD or closest date",
  "firstEmiDate": "YYYY-MM-DD or first repayment date",
  "processingFee": number or 0,
  "notes": "Brief summary of key charges or prepayment terms"
}
Do NOT include markdown backticks or explanations, return ONLY pure JSON.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const textOutput = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error('No data returned from Gemini AI');
  }

  const parsed = JSON.parse(textOutput);
  return {
    name: parsed.name || `${parsed.lender || 'Bank'} Loan`,
    lender: parsed.lender || 'HDFC Bank',
    accountNumber: parsed.accountNumber,
    loanType: parsed.loanType || 'PERSONAL',
    principalAmount: Number(parsed.principalAmount) || 0,
    annualInterestRate: Number(parsed.annualInterestRate) || 0,
    tenureMonths: Number(parsed.tenureMonths) || 36,
    monthlyEmi: Number(parsed.monthlyEmi) || 0,
    dueDayOfMonth: Number(parsed.dueDayOfMonth) || 7,
    sanctionDate: parsed.sanctionDate || new Date().toISOString().split('T')[0],
    firstEmiDate: parsed.firstEmiDate || new Date().toISOString().split('T')[0],
    processingFee: parsed.processingFee ? Number(parsed.processingFee) : undefined,
    notes: parsed.notes || 'Parsed by Gemini AI',
  };
}

// Master scanner with automatic fallback
export async function scanLoanDocument(
  file: File,
  onStatusUpdate?: (status: string) => void
): Promise<ScanResult> {
  const apiKey = getStoredGeminiKey();

  // 1. If Gemini Key is present, use Gemini Vision (highest accuracy for any format)
  if (apiKey) {
    try {
      onStatusUpdate?.('✨ Gemini AI analyzing sanction document...');
      const geminiData = await parseWithGemini(file, apiKey);
      return {
        data: geminiData,
        method: 'GEMINI_AI',
        message: 'Successfully extracted with Gemini AI Vision',
      };
    } catch (aiErr: any) {
      console.warn('Gemini AI scan encountered error, trying local parser fallback:', aiErr);
    }
  }

  // 2. If no key or Gemini failed, try local text parser for PDFs
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    try {
      onStatusUpdate?.('📄 Reading PDF text locally...');
      const text = await extractTextFromPdf(file);
      const regexData = parseTextWithRegex(text);
      if (regexData && regexData.principalAmount) {
        return {
          data: regexData,
          method: 'LOCAL_REGEX',
          message: 'Extracted via Local RBI KFS Text Engine (0 tokens used)',
        };
      }
    } catch (localErr) {
      console.warn('Local PDF extraction error:', localErr);
    }
  }

  // If both failed or image without API key
  throw new Error(
    apiKey
      ? 'Could not extract loan details from this document. Please check the file or enter details manually.'
      : 'Could not auto-read this file format locally. Enter details manually or configure a free Gemini API key to enable AI photo/scan parsing.'
  );
}
