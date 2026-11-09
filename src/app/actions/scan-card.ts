'use server'

export interface CardScanResult {
  name: string
  jobTitle: string
  company: string
  phone: string
  email: string
  website: string
  address: string
  source: 'ai_vision' | 'client_ocr'
}

/**
 * Server action that uses multimodal Vision AI (Google Gemini) to extract contact details from business card photos.
 * Analyzes typography, layout, logos, and contact labels with human-level accuracy.
 */
export async function scanBusinessCardWithAI(
  base64Image: string,
  customApiKey?: string | null
): Promise<{ success: boolean; data?: CardScanResult; useClientOCR?: boolean; error?: string }> {
  const apiKey = (customApiKey || '').trim() || process.env.GEMINI_API_KEY

  if (!apiKey) {
    // No API key configured: seamlessly use client-side OCR
    return { success: false, useClientOCR: true }
  }

  // Strip data URL header if present (e.g. data:image/jpeg;base64,...)
  const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '')

  // Fallback cascade for model availability
  const candidateModels = ['gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3.5-flash']

  for (const modelName of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert AI business card reader and entity classifier.
Analyze this business card image with meticulous accuracy.
Identify and extract:
1. "name": The full name of the individual (person). Distinguish this from company name or slogans.
2. "jobTitle": The job title, profession, or designation (e.g., "Senior Architect", "Managing Director", "Consultant", "Doctor", "Founder").
3. "company": The company, firm, brand, or organization name.
4. "phone": The primary mobile / telephone number including international country code (+...) if shown.
5. "email": The clean, valid email address.
6. "website": Clean website URL if present.
7. "address": The business/office/clinic physical address if present.

Return STRICTLY a valid JSON object with those 7 keys.
If any field is missing on the card, set its value to "".
Do NOT include markdown formatting, codeblocks, or extra text.`,
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      })

      if (!response.ok) {
        console.warn(`Gemini model ${modelName} returned status ${response.status}. Trying next model...`)
        continue
      }

      const json = await response.json()
      const contentText = json?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!contentText) {
        continue
      }

      const parsed = JSON.parse(contentText)

      return {
        success: true,
        data: {
          name: parsed.name || '',
          jobTitle: parsed.jobTitle || '',
          company: parsed.company || '',
          phone: parsed.phone || '',
          email: parsed.email || '',
          website: parsed.website || '',
          address: parsed.address || '',
          source: 'ai_vision',
        },
      }
    } catch (err: unknown) {
      console.warn(`Error invoking Gemini model ${modelName}:`, err)
    }
  }

  // If all Gemini models failed or had high traffic spikes, fallback cleanly to on-device OCR
  return { success: false, useClientOCR: true }
}
