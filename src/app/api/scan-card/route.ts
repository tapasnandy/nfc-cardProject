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
 * Robust API Route Handler for Multimodal Business Card OCR & Classification.
 * Uses Google Gemini Vision via a fallback model cascade.
 * 
 * Unlike Server Actions, this HTTP Route Handler:
 * 1. Runs outside React Server Component / Flight serialization (no minified React #441/#331 errors).
 * 2. Has no 1MB Server Action payload limit.
 * 3. Returns structured JSON with safe fallbacks and timeouts.
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

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        useClientOCR: true,
        error: 'No Gemini API key configured',
      })
    }

    // Clean base64 data URL prefix
    const cleanBase64 = image.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '')

    // Model cascade for high availability
    const candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-flash-latest',
      'gemini-3.5-flash',
    ]

    for (const modelName of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 12000) // 12-second timeout per attempt

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
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

        const parsed = JSON.parse(contentText)

        const result: CardScanResult = {
          name: typeof parsed.name === 'string' ? parsed.name.trim() : '',
          jobTitle: typeof parsed.jobTitle === 'string' ? parsed.jobTitle.trim() : '',
          company: typeof parsed.company === 'string' ? parsed.company.trim() : '',
          phone: typeof parsed.phone === 'string' ? parsed.phone.trim() : '',
          email: typeof parsed.email === 'string' ? parsed.email.trim() : '',
          website: typeof parsed.website === 'string' ? parsed.website.trim() : '',
          address: typeof parsed.address === 'string' ? parsed.address.trim() : '',
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
      error: 'An error occurred while processing the card. Falling back to on-device OCR.',
    })
  }
}
