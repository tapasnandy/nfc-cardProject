import { NextRequest, NextResponse } from 'next/server'

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
 * Robust API Route Handler for Multimodal Business Card OCR & Entity Extraction.
 * Uses Google Gemini Vision via a high-performance flash-lite model cascade.
 * 
 * Runs outside React Server Component Flight serialization to eliminate 
 * any minified React #441 / #331 errors and payload restrictions.
 */
export async function POST(req: NextRequest) {
  try {
    let body: { image?: string; customApiKey?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request payload. Image is required.', useClientOCR: true },
        { status: 400 }
      )
    }

    const { image, customApiKey } = body
    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { success: false, error: 'No image provided for scanning', useClientOCR: true },
        { status: 400 }
      )
    }

    const apiKey = (customApiKey || '').trim() || process.env.GEMINI_API_KEY

    // Clean base64 data URL prefix
    const cleanBase64 = image.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '')
    if (!cleanBase64) {
      return NextResponse.json(
        { success: false, error: 'Empty image payload', useClientOCR: true },
        { status: 400 }
      )
    }

    // High-performance models: prioritize ultra-fast flash-lite models for sub-2s responses
    const candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash',
    ]

    const promptText = `You are an expert AI business card reader and entity classifier.
Analyze this business card image with meticulous accuracy.
The card photo may be captured from any angle, rotated, or under varying lighting.

Accurately detect and extract the following 7 fields:
1. "name": The full name of the individual person (e.g., "Dr. Robert Smith", "Tanvir Ahmed", "Sarah Jenkins"). Look for personal titles (Mr., Ms., Dr., Engr., Advocate). Distinguish this clearly from the company or organization name.
2. "jobTitle": The professional designation or title (e.g., "Managing Director", "Chief Technology Officer", "Senior Consultant", "Founder & CEO", "Architect", "Sales Executive").
3. "company": The firm, business, hospital, university, or brand name (e.g., "Apex Group", "Acme Corp").
4. "phone": The primary mobile or phone number. Include international country code if visible or standard. Extract digits and clean separators.
5. "email": The clean, valid email address (containing @ and domain).
6. "website": Clean website URL (e.g., "https://example.com" or "www.example.com").
7. "address": The physical business address, office location, chamber, or clinic address.

Return STRICTLY a JSON object with these 7 keys: "name", "jobTitle", "company", "phone", "email", "website", "address".
If any field is not found on the card, set its value to "".
Do not wrap in extra explanation, markdown commentary, or backticks outside the JSON object.`

    for (const modelName of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15-second timeout per attempt

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptText },
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

        clearTimeout(timeoutId)

        if (!response.ok) {
          console.warn(`Gemini model ${modelName} returned status ${response.status}. Trying next model...`)
          continue
        }

        const json = await response.json()
        const contentText = json?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!contentText) {
          continue
        }

        // Clean any accidental markdown code fences
        const cleanJson = contentText
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim()

        const parsed = JSON.parse(cleanJson)

        const result: CardScanResult = {
          name: typeof parsed.name === 'string' ? parsed.name.trim() : (parsed.name ? String(parsed.name) : ''),
          jobTitle: typeof parsed.jobTitle === 'string' ? parsed.jobTitle.trim() : (parsed.jobTitle ? String(parsed.jobTitle) : ''),
          company: typeof parsed.company === 'string' ? parsed.company.trim() : (parsed.company ? String(parsed.company) : ''),
          phone: typeof parsed.phone === 'string' ? parsed.phone.trim() : (parsed.phone ? String(parsed.phone) : ''),
          email: typeof parsed.email === 'string' ? parsed.email.trim() : (parsed.email ? String(parsed.email) : ''),
          website: typeof parsed.website === 'string' ? parsed.website.trim() : (parsed.website ? String(parsed.website) : ''),
          address: typeof parsed.address === 'string' ? parsed.address.trim() : (parsed.address ? String(parsed.address) : ''),
          source: 'ai_vision',
        }

        return NextResponse.json({
          success: true,
          data: result,
        })
      } catch (modelErr: unknown) {
        console.warn(`Error invoking Gemini model ${modelName}:`, modelErr)
      }
    }

    // If all models failed or timed out, gracefully notify client to use on-device OCR
    return NextResponse.json({
      success: false,
      useClientOCR: true,
      error: 'AI Vision temporarily unavailable. Falling back to on-device OCR.',
    })
  } catch (err: unknown) {
    console.error('Unhandled error in /api/scan-card:', err)
    return NextResponse.json({
      success: false,
      useClientOCR: true,
      error: 'Card scanning failed',
    }, { status: 500 })
  }
}
