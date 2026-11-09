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
  base64Image: string,
  customApiKey?: string | null
): Promise<{ success: boolean; data?: CardScanResult; useClientOCR?: boolean; error?: string }> {
  const apiKey = (customApiKey || '').trim() || process.env.GEMINI_API_KEY

  if (!apiKey) {
    // No API key configured: seamlessly use client-side OCR
    return { success: false, useClientOCR: true }
  }

  try {
    // Strip data URL header if present (e.g. data:image/jpeg;base64,...)
    const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '')

    // Models supported by Google API with automatic fallback for high availability
    const candidateModels = [
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
    ]

    const promptPayload = {
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
    }

    let parsed: Record<string, string> | null = null

    for (const model of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promptPayload),
        })

        if (!response.ok) {
          console.warn(`Gemini (${model}) returned status ${response.status}, trying next fallback...`)
          continue
        }

        const json = await response.json()
        const contentText = json?.candidates?.[0]?.content?.parts?.[0]?.text
        if (contentText) {
          parsed = JSON.parse(contentText)
          break
        }
      } catch (modelErr) {
        console.warn(`Gemini model ${model} failed:`, modelErr)
      }
    }

    if (!parsed) {
      return { success: false, useClientOCR: true }
    }

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
