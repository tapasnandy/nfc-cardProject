/**
 * Advanced Business Card Parser & OCR Preprocessor
 * Supports varied templates, multi-number extraction, multi-email, address, and intelligent heuristics.
 */

export interface DetectedContactNumber {
  number: string
  label: 'mobile' | 'office' | 'tel' | 'fax' | 'whatsapp' | 'other'
  formattedLabel: string
}

export interface ParsedBusinessCard {
  name: string
  phone: string // Primary phone (prefers mobile/cell)
  phoneNumbers: DetectedContactNumber[] // All detected phone numbers
  email: string // Primary email
  emails: string[] // All detected emails
  company: string
  jobTitle: string
  website: string
  websites: string[]
  address: string
  rawText: string
}

const COMMON_TITLES = [
  'ceo', 'cto', 'cfo', 'coo', 'founder', 'co-founder', 'president', 'vice president', 'vp',
  'director', 'managing director', 'executive director', 'general manager', 'manager', 'lead',
  'sales manager', 'account manager', 'business development', 'consultant', 'senior consultant',
  'specialist', 'officer', 'engineer', 'senior engineer', 'software engineer', 'developer',
  'designer', 'ui/ux', 'creative director', 'architect', 'analyst', 'associate', 'advisor',
  'representative', 'sales executive', 'agent', 'broker', 'realtor', 'partner', 'managing partner',
  'attorney', 'advocate', 'lawyer', 'counsel', 'doctor', 'physician', 'surgeon', 'dr.', 'prof.',
  'professor', 'head of', 'project manager', 'marketing manager', 'product manager'
]

const COMPANY_SUFFIXES = [
  'inc', 'inc.', 'llc', 'llc.', 'ltd', 'ltd.', 'corp', 'corp.', 'corporation', 'company', 'co.',
  'group', 'holdings', 'enterprises', 'solutions', 'technologies', 'technology', 'tech',
  'agency', 'realty', 'real estate', 'properties', 'services', 'consulting', 'consultancy',
  'associates', 'studios', 'studio', 'labs', 'lab', 'ventures', 'industries', 'logistics',
  'international', 'pvt', 'pvt.', 'plc', 'gmbh', 'co., ltd', 'co.,ltd'
]

const ADDRESS_KEYWORDS = [
  'road', 'rd.', 'rd', 'street', 'st.', 'st', 'avenue', 'ave.', 'ave', 'lane', 'ln',
  'boulevard', 'blvd', 'suite', 'ste', 'floor', 'fl.', 'fl', 'block', 'sector', 'house',
  'plot', 'building', 'tower', 'plaza', 'center', 'centre', 'square', 'city', 'po box',
  'p.o. box', 'zip', 'state', 'district', 'dhaka', 'new york', 'london', 'dubai', 'singapore'
]

/**
 * Normalizes phone numbers for comparison and deduplication.
 */
function cleanDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Parses raw OCR text from any business card layout.
 */
export function parseBusinessCardText(text: string): ParsedBusinessCard {
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  // -------------------------------------------------------------
  // 1. EXTRACT ALL EMAILS
  // -------------------------------------------------------------
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
  const foundEmails: string[] = []
  const emailMatches = text.match(emailRegex) || []
  for (const m of emailMatches) {
    const cleaned = m.toLowerCase().trim()
    if (!foundEmails.includes(cleaned)) {
      foundEmails.push(cleaned)
    }
  }

  // -------------------------------------------------------------
  // 2. EXTRACT ALL WEBSITES & SOCIAL PROFILES
  // -------------------------------------------------------------
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?(?:\/[^\s,;]*)?)/gi
  const foundWebsites: string[] = []
  const urlMatches = text.match(urlRegex) || []
  for (const match of urlMatches) {
    const cleaned = match.trim()
    // Ensure it's not the domain portion of an email
    const isEmailDomain = foundEmails.some((em) => em.includes(cleaned) || cleaned.includes(em))
    if (!isEmailDomain && !foundWebsites.includes(cleaned) && cleaned.includes('.')) {
      // Don't match random file extensions like image.png or dots
      if (!cleaned.match(/\.(png|jpg|jpeg|gif|svg|pdf)$/i)) {
        foundWebsites.push(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`)
      }
    }
  }

  // -------------------------------------------------------------
  // 3. EXTRACT ALL PHONE NUMBERS (MULTIPLE NUMBERS HANDLING)
  // -------------------------------------------------------------
  // Matches labeled or unlabeled phone patterns across lines and multi-number lines
  const phoneNumbers: DetectedContactNumber[] = []
  const seenDigits = new Set<string>()

  // Sub-segments per line to catch lines like: "Tel: +1 234 567 | Mob: +1 987 654"
  for (const line of rawLines) {
    // Check if line contains multiple phone segments separated by delimiters
    const segments = line.split(/[|/\\;•]/).map((s) => s.trim()).filter(Boolean)

    for (const segment of segments) {
      // Check for phone label
      const labelMatch = segment.match(
        /(?:(mob(?:ile)?|cell(?:ular)?|whatsapp|wa|m)\b|(?:tel(?:ephone)?|phone|office|work|o|t|ph)\b|(?:fax|f)\b|(?:direct|dir|d)\b)[\s.:#*-]*/i
      )

      let detectedLabel: DetectedContactNumber['label'] = 'other'
      let formattedLabel = 'Phone'

      if (labelMatch) {
        const rawLbl = labelMatch[1] ? labelMatch[1].toLowerCase() : (labelMatch[0] || '').toLowerCase()
        if (rawLbl.match(/mob|cell|wa|whatsapp|^m$/i)) {
          detectedLabel = 'mobile'
          formattedLabel = 'Mobile'
        } else if (rawLbl.match(/fax|^f$/i)) {
          detectedLabel = 'fax'
          formattedLabel = 'Fax'
        } else if (rawLbl.match(/tel|phone|office|work|^t$|^o$|^ph$/i)) {
          detectedLabel = 'office'
          formattedLabel = 'Office / Tel'
        } else if (rawLbl.match(/direct|dir|^d$/i)) {
          detectedLabel = 'tel'
          formattedLabel = 'Direct Line'
        }
      }

      // Match phone numbers: allows optional country code +, spaces, dashes, parentheses, extensions
      const phoneExtractRegex = /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,5}(?:\s*(?:ext|x|ext\.)\s*\d{1,5})?/g
      const matches = segment.match(phoneExtractRegex) || []

      for (const num of matches) {
        const trimmed = num.trim()
        const digits = cleanDigits(trimmed)

        // Validate length: most global numbers have 7 to 15 digits
        if (digits.length >= 7 && digits.length <= 16) {
          // Avoid years or duplicate numbers
          if (!seenDigits.has(digits)) {
            seenDigits.add(digits)
            phoneNumbers.push({
              number: trimmed,
              label: detectedLabel,
              formattedLabel: formattedLabel,
            })
          }
        }
      }
    }
  }

  // Determine Primary Phone:
  // Preference order: mobile -> direct/office -> first phone found
  let primaryPhone = ''
  const mobileMatch = phoneNumbers.find((p) => p.label === 'mobile')
  const officeMatch = phoneNumbers.find((p) => p.label === 'office' || p.label === 'tel')

  if (mobileMatch) {
    primaryPhone = mobileMatch.number
  } else if (officeMatch) {
    primaryPhone = officeMatch.number
  } else if (phoneNumbers.length > 0) {
    primaryPhone = phoneNumbers[0].number
  }

  // -------------------------------------------------------------
  // 4. EXTRACT JOB TITLE
  // -------------------------------------------------------------
  let jobTitle = ''
  for (const line of rawLines) {
    const lower = line.toLowerCase()
    const isTitle = COMMON_TITLES.some((t) => lower.includes(t))
    if (isTitle && !line.includes('@') && !line.match(/\d{5,}/)) {
      // Don't capture overly long lines as title
      if (line.length <= 60) {
        jobTitle = line
        break
      }
    }
  }

  // -------------------------------------------------------------
  // 5. EXTRACT COMPANY / ORGANIZATION
  // -------------------------------------------------------------
  let company = ''
  for (const line of rawLines) {
    const lower = line.toLowerCase()
    const isCompany = COMPANY_SUFFIXES.some((suffix) => {
      const words = lower.split(/[\s,.-]+/)
      return words.includes(suffix) || lower.endsWith(suffix)
    })

    if (isCompany && line !== jobTitle && !line.includes('@') && line.length <= 80) {
      company = line
      break
    }
  }

  // If company wasn't found by suffix, derive from corporate email or website domain
  if (!company) {
    const primaryEmail = foundEmails[0]
    if (primaryEmail) {
      const domain = primaryEmail.split('@')[1]?.split('.')[0]
      if (domain && !['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'proton', 'mail', 'live'].includes(domain)) {
        company = domain.charAt(0).toUpperCase() + domain.slice(1)
      }
    }
  }

  if (!company && foundWebsites.length > 0) {
    try {
      const host = new URL(foundWebsites[0]).hostname.replace(/^www\./, '').split('.')[0]
      if (host && host.length >= 3 && !['linktr', 'bio', 'tapnet'].includes(host)) {
        company = host.charAt(0).toUpperCase() + host.slice(1)
      }
    } catch {
      // Ignore URL parsing errors
    }
  }

  // -------------------------------------------------------------
  // 6. EXTRACT ADDRESS
  // -------------------------------------------------------------
  const addressLines: string[] = []
  for (const line of rawLines) {
    const lower = line.toLowerCase()
    const hasAddressKw = ADDRESS_KEYWORDS.some((kw) => lower.includes(kw))
    if (
      hasAddressKw &&
      line !== jobTitle &&
      line !== company &&
      !line.includes('@') &&
      !phoneNumbers.some((p) => p.number === line)
    ) {
      addressLines.push(line)
    }
  }
  const address = addressLines.slice(0, 2).join(', ')

  // -------------------------------------------------------------
  // 7. EXTRACT PERSON NAME (HIGH PRECISION HEURISTICS)
  // -------------------------------------------------------------
  let name = ''

  // Filter candidate lines
  const candidateNameLines = rawLines.filter((line) => {
    // Eliminate lines with phone numbers, emails, websites, or address keywords
    if (line.includes('@') || line.includes('www.') || line.includes('http') || line.includes('.com')) {
      return false
    }
    if (phoneNumbers.some((p) => line.includes(p.number) || cleanDigits(line).length >= 7)) {
      return false
    }
    if (line === jobTitle || line === company || addressLines.includes(line)) {
      return false
    }
    // Check if line consists mostly of letters and spaces (2 to 4 words)
    const words = line.split(/\s+/).filter(Boolean)
    if (words.length >= 2 && words.length <= 4) {
      const letterPercentage = (line.replace(/[^a-zA-Z]/g, '').length / line.length)
      return letterPercentage > 0.8
    }
    return false
  })

  if (candidateNameLines.length > 0) {
    name = candidateNameLines[0]
  } else {
    // Fallback: Pick top non-contact line with letters
    for (const line of rawLines) {
      if (
        !line.includes('@') &&
        !line.match(/\d{5,}/) &&
        line !== jobTitle &&
        line !== company &&
        line.length <= 40
      ) {
        name = line
        break
      }
    }
  }

  return {
    name,
    phone: primaryPhone,
    phoneNumbers,
    email: foundEmails[0] || '',
    emails: foundEmails,
    company,
    jobTitle,
    website: foundWebsites[0] || '',
    websites: foundWebsites,
    address,
    rawText: text.trim(),
  }
}

/**
 * Advanced Image Preprocessor for Business Cards:
 * 1. Resizes photo to optimal OCR resolution.
 * 2. Applies Grayscale conversion.
 * 3. Enhances contrast and sharpness to make faded/dark card text pop clearly.
 */
export async function preprocessCardImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX_DIM = 1800
        let { width, height } = img

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width)
            width = MAX_DIM
          } else {
            width = Math.round((width * MAX_DIM) / height)
            height = MAX_DIM
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d', { willReadFrequently: true })

        if (!ctx) {
          resolve(e.target?.result as string)
          return
        }

        // 1. Draw base image
        ctx.drawImage(img, 0, 0, width, height)

        try {
          // 2. Grayscale + Dynamic Contrast Enhancement
          const imgData = ctx.getImageData(0, 0, width, height)
          const data = imgData.data

          // Find min and max luminance for histogram contrast stretching
          let minLum = 255
          let maxLum = 0

          for (let i = 0; i < data.length; i += 4) {
            const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
            if (lum < minLum) minLum = lum
            if (lum > maxLum) maxLum = lum
          }

          const range = maxLum - minLum || 1

          for (let i = 0; i < data.length; i += 4) {
            const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
            // Contrast stretch to [0, 255]
            const stretched = Math.min(255, Math.max(0, ((lum - minLum) / range) * 255))

            // Slight S-curve contrast boost for crisp letter edges
            const enhanced = stretched < 128
              ? (stretched * stretched) / 128
              : 255 - ((255 - stretched) * (255 - stretched)) / 128

            data[i] = enhanced
            data[i + 1] = enhanced
            data[i + 2] = enhanced
          }

          ctx.putImageData(imgData, 0, 0)
        } catch (procErr) {
          console.warn('Canvas image enhancement skipped, using standard draw:', procErr)
        }

        resolve(canvas.toDataURL('image/jpeg', 0.92))
      }
      img.onerror = () => reject(new Error('Failed to load card image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read card image file'))
    reader.readAsDataURL(file)
  })
}
