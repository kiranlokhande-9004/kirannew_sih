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
  const base64Data = await fileToBase64(imageFile);
  const base64 = base64Data.split(',')[1];

  const response = await fetch('/api/analyze-label', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64: base64,
      mimeType: imageFile.type || 'image/jpeg',
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
  return data as LabelAnalysis;
}
