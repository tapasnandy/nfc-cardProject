import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

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

    let cfGeminiKey = ''
    let availableEnvKeys: string[] = []
    try {
      const ctx = await getCloudflareContext({ async: true })
      const envObj = ctx?.env as Record<string, unknown> | undefined
      if (envObj) {
        availableEnvKeys = Object.keys(envObj)
        const keyCandidate =
          envObj.GEMINI_API_KEY ??
          envObj.NEXT_PUBLIC_GEMINI_API_KEY ??
          envObj.GOOGLE_API_KEY ??
          envObj.GOOGLE_GENERATIVE_AI_API_KEY
        if (typeof keyCandidate === 'string') {
          cfGeminiKey = keyCandidate.trim()
        }
      }
    } catch {
      // Running outside Cloudflare Workers context (e.g., local next dev)
    }

    const processKey = (
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      ''
    ).trim()

    const apiKey = (customApiKey || '').trim() || cfGeminiKey || processKey

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        useClientOCR: true,
        error: `GEMINI_API_KEY is not set in Cloudflare Runtime Variables & Secrets or process.env. (Detected CF bindings: ${availableEnvKeys.join(', ') || 'none'})`,
      })
    }

    // Extract mimeType and clean base64 data URL prefix
    const mimeMatch = image.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/)
    const mimeType = mimeMatch?.[1] || 'image/jpeg'
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
      'gemini-3.8-flash',
    ]

    const promptText = `You are an expert AI business card reader and entity classifier.
Analyze this business card image with meticulous accuracy.
The card photo may be captured from any angle, rotated, or under varying lighting.

Accurately detect and extract the following 7 fields:
1. "name": The full name of the individual person (e.g., "Dr. Robert Smith", "Tanvir Ahmed", "Sarah Jenkins"). Look for personal titles (Mr., Ms., Dr., Engr., Advocate). Distinguish this clearly from the company or organization name.
2. "jobTitle": The professional designation or title (e.g., "Managing Director", "Chief Technology Officer", "Senior Consultant", "Founder & CEO", "Architect", "Sales Executive").
3. "company": The firm, business, hospital, university, or brand name (e.g., "Apex Group", "Acme Corp").
4. "phone": The primary mobile or phone number. Include international country code if visible or standard. Extract digits and clean separators. If multiple numbers exist, pick the primary mobile number.
5. "email": The clean, valid email address (containing @ and domain).
6. "website": Clean website URL (e.g., "https://example.com" or "www.example.com").
7. "address": The physical business address, office location, chamber, or clinic address.

Return STRICTLY a JSON object with these 7 keys: "name", "jobTitle", "company", "phone", "email", "website", "address".
If any field is not found on the card, set its value to "".
Do not wrap in extra explanation, markdown commentary, or backticks outside the JSON object.`

    let lastError = 'AI Vision temporarily unavailable.'

    for (const modelName of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`

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
                  { text: promptText },
                  {
                    inlineData: {
                      mimeType,
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
          const errText = await response.text().catch(() => '')
          lastError = `Gemini (${modelName}) HTTP ${response.status}: ${errText.slice(0, 160)}`
          console.warn(lastError)
          continue
        }

        const json = await response.json()
        const contentText = json?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!contentText) {
          const blockReason = json?.promptFeedback?.blockReason || json?.candidates?.[0]?.finishReason
          lastError = blockReason
            ? `Gemini (${modelName}) blocked/empty response: ${blockReason}`
            : `Gemini (${modelName}) returned empty content`
          continue
        }

        // Clean any accidental markdown code fences
        const cleanJson = contentText
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim()

        const parsed = JSON.parse(cleanJson)

        const toStr = (val: unknown): string => {
          if (val === null || val === undefined) return ''
          if (Array.isArray(val)) return val[0] ? String(val[0]).trim() : ''
          return String(val).trim()
        }

        const result: CardScanResult = {
          name: toStr(parsed.name),
          jobTitle: toStr(parsed.jobTitle),
          company: toStr(parsed.company),
          phone: toStr(parsed.phone),
          email: toStr(parsed.email),
          website: toStr(parsed.website),
          address: toStr(parsed.address),
          source: 'ai_vision',
        }

        return NextResponse.json({
          success: true,
          data: result,
        })
      } catch (modelErr: unknown) {
        lastError = modelErr instanceof Error ? modelErr.message : String(modelErr)
        console.warn(`Error invoking Gemini model ${modelName}:`, modelErr)
      }
    }

    // If all models failed or timed out, gracefully notify client to use on-device OCR
    return NextResponse.json({
      success: false,
      useClientOCR: true,
      error: lastError,
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
