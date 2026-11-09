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
 * Server action that attempts high-precision Vision AI extraction if GEMINI_API_KEY is available.
 * If no key is configured, it signals the client to use the enhanced on-device OCR engine.
 */
export async function scanBusinessCardWithAI(
  base64Image: string
): Promise<{ success: boolean; data?: CardScanResult; useClientOCR?: boolean; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    // No API key configured: seamlessly use client-side OCR
    return { success: false, useClientOCR: true }
  }

  try {
    // Strip data URL header if present (e.g. data:image/jpeg;base64,...)
    const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '')

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an expert OCR and business card reader. Extract contact details from this business card image with 100% spelling precision.
Return strictly a valid JSON object with these exact keys:
{
  "name": "Full name of the person",
  "jobTitle": "Job title / designation",
  "company": "Company / business / organization name",
  "phone": "Primary mobile or phone number with international country code",
  "email": "Clean email address",
  "website": "Clean website URL if present",
  "address": "Office or chamber address if present"
}
If any field is not found or unclear on the card, set its value to an empty string "". Do not include markdown codeblocks or any additional commentary.`,
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
      console.warn('Gemini API call failed, falling back to local OCR:', response.statusText)
      return { success: false, useClientOCR: true }
    }

    const json = await response.json()
    const contentText = json?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!contentText) {
      return { success: false, useClientOCR: true }
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
    console.warn('AI Vision scan failed, falling back to client OCR:', err)
    return { success: false, useClientOCR: true }
  }
}
