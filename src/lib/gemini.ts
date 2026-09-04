import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export interface LabelViolation {
  type: string;
  severity: 'critical' | 'major' | 'minor';
  detail: string;
}

export interface LabelAnalysis {
  product_name: string;
  manufacturer: string;
  is_compliant: boolean;
  violations: LabelViolation[];
  confidence: number;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function analyzeLabel(imageFile: File): Promise<LabelAnalysis> {
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const base64Data = await fileToBase64(imageFile);
  const base64 = base64Data.split(',')[1];

  const prompt = `You are a Legal Metrology Inspector AI for India.
Analyze this product label image and check PCR 2011 compliance.

Check for these violations:
1. MRP present in ₹ format?
2. Net quantity in grams/ml/kg/l (NOT lbs/oz/fl oz)?
3. Manufacturer name AND complete address present?
4. Best Before OR Expiry date present?
5. Batch/Lot number present?
6. Country of Origin present?

Respond ONLY in this exact JSON format, no other text:
{
  "product_name": "detected product name or Unknown",
  "manufacturer": "detected manufacturer or Unknown",
  "is_compliant": true or false,
  "violations": [
    {
      "type": "violation name",
      "severity": "critical or major or minor",
      "detail": "specific detail about this violation"
    }
  ],
  "confidence": 0.0 to 1.0
}`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { mimeType: imageFile.type, data: base64 } },
  ]);

  const text = result.response.text();
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as LabelAnalysis;
}
