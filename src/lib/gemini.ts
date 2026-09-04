import { supabase } from '@/lib/supabase';

export interface LabelViolation {
  type: string;
  description: string;
  clause_reference: string;
  severity: 'critical' | 'major' | 'minor' | string;
}

export interface LabelAnalysis {
  product_name: string;
  brand: string;
  is_compliant: boolean;
  compliance_score: number;
  violations: LabelViolation[];
  detected_text: Record<string, unknown>;
  summary: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function analyzeLabel(imageFile: File, imagePath?: string): Promise<LabelAnalysis> {
  const base64Data = await fileToBase64(imageFile);
  const base64 = base64Data.split(',')[1];
  const mimeType = imageFile.type || 'image/jpeg';

  // 1. First attempt calling Supabase Edge Function "analyze-label"
  try {
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('analyze-label', {
      body: {
        imagePath,
        imageBase64: base64,
        mimeType,
        filename: imageFile.name,
      },
    });

    if (!edgeError && edgeData && (edgeData.product_name || edgeData.violations)) {
      return normalizeAnalysis(edgeData);
    }
  } catch (edgeErr) {
    console.warn('Supabase Edge Function invoke failed, using backend proxy fallback:', edgeErr);
  }

  // 2. Fallback to /api/analyze-label backend endpoint
  const response = await fetch('/api/analyze-label', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imagePath,
      imageBase64: base64,
      mimeType,
      filename: imageFile.name,
    }),
  });

  if (!response.ok) {
    let errorMsg = 'Failed to analyze label image';
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return normalizeAnalysis(data);
}

function normalizeAnalysis(raw: Record<string, unknown>): LabelAnalysis {
  const rawViolations = Array.isArray(raw.violations) ? (raw.violations as Record<string, unknown>[]) : [];

  const violations: LabelViolation[] = rawViolations.map((v) => {
    const sev = typeof v.severity === 'string' ? v.severity.toLowerCase() : 'minor';
    const severity: 'critical' | 'major' | 'minor' =
      sev === 'critical' || sev === 'major' || sev === 'minor' ? sev : 'minor';

    return {
      type: typeof v.type === 'string' ? v.type : 'Rule Non-Compliance',
      description: typeof v.description === 'string' ? v.description : (typeof v.detail === 'string' ? v.detail : 'Violation of Legal Metrology regulations.'),
      clause_reference: typeof v.clause_reference === 'string' ? v.clause_reference : 'Rule 6, Legal Metrology (Packaged Commodities) Rules, 2011',
      severity,
    };
  });

  const complianceScore =
    typeof raw.compliance_score === 'number'
      ? raw.compliance_score
      : violations.length === 0
      ? 100
      : Math.max(10, 100 - violations.length * 20);

  const detectedText =
    raw.detected_text && typeof raw.detected_text === 'object'
      ? (raw.detected_text as Record<string, unknown>)
      : {};

  return {
    product_name: typeof raw.product_name === 'string' ? raw.product_name : 'Scanned Packaged Commodity',
    brand: typeof raw.brand === 'string' ? raw.brand : (typeof raw.manufacturer === 'string' ? raw.manufacturer : 'Unbranded / Unknown'),
    is_compliant: typeof raw.is_compliant === 'boolean' ? raw.is_compliant : violations.length === 0,
    compliance_score: complianceScore,
    violations,
    detected_text: detectedText,
    summary: typeof raw.summary === 'string' ? raw.summary : (violations.length === 0 ? 'All mandatory declarations verified.' : 'Non-compliances detected.'),
  };
}
