/**
 * High-Precision Business Card Parser & OCR Healer
 * Solves:
 * 1. Accurately identifies Full Name using font size ranking & layout structure.
 * 2. Heals OCR digit typos in phone numbers (O->0, l->1, S->5, B->8) & detects all formats (+880, +1, local).
 * 3. Heals email OCR typos (@ read as © or (c), .corn -> .com, spaces around @).
 * 4. Extracts Company Name and dedicated Job Title.
 * 5. Leaves Meeting Notes completely empty.
 * 6. Uses clean, non-destructive canvas scaling to avoid pixel distortion and spelling mistakes.
 */

export interface DetectedContactNumber {
  number: string
  label: 'mobile' | 'office' | 'tel' | 'fax' | 'whatsapp' | 'other'
  formattedLabel: string
}

export interface ParsedLineInfo {
  text: string
  height?: number
  confidence?: number
}

export interface ParsedBusinessCard {
  name: string
  jobTitle: string
  company: string
  phone: string
  phoneNumbers: DetectedContactNumber[]
  email: string
  emails: string[]
  website: string
  websites: string[]
  address: string
  rawText: string
}

const COMMON_TITLES = [
  'ceo', 'cto', 'cfo', 'coo', 'founder', 'co-founder', 'president', 'vice president', 'vp',
  'managing director', 'executive director', 'general manager', 'director', 'manager', 'lead',
  'head of', 'sales director', 'sales manager', 'account manager', 'business development',
  'senior consultant', 'consultant', 'specialist', 'officer', 'senior engineer', 'software engineer',
  'engineer', 'developer', 'designer', 'creative director', 'architect', 'analyst', 'associate',
  'advisor', 'representative', 'sales executive', 'agent', 'broker', 'realtor', 'partner',
  'managing partner', 'attorney', 'advocate', 'lawyer', 'counsel', 'doctor', 'physician',
  'surgeon', 'dr.', 'prof.', 'professor', 'project manager', 'marketing manager', 'product manager'
]

const COMPANY_SUFFIXES = [
  'ltd', 'ltd.', 'limited', 'inc', 'inc.', 'llc', 'llc.', 'corp', 'corp.', 'corporation',
  'company', 'co.', 'group', 'holdings', 'enterprises', 'solutions', 'technologies', 'technology',
  'tech', 'agency', 'realty', 'real estate', 'properties', 'services', 'consulting', 'consultancy',
  'associates', 'studios', 'studio', 'labs', 'lab', 'ventures', 'industries', 'logistics',
  'international', 'pvt', 'pvt.', 'plc', 'gmbh', 'co., ltd', 'co.,ltd', 'hospital', 'clinic',
  'bank', 'center', 'centre'
]

const ADDRESS_KEYWORDS = [
  'road', 'rd.', 'rd', 'street', 'st.', 'st', 'avenue', 'ave.', 'ave', 'lane', 'ln',
  'boulevard', 'blvd', 'suite', 'ste', 'floor', 'fl.', 'fl', 'block', 'sector', 'house',
  'plot', 'building', 'tower', 'plaza', 'center', 'centre', 'square', 'city', 'po box',
  'p.o. box', 'zip', 'dhaka', 'new york', 'london', 'dubai', 'singapore'
]

/**
 * Heals common OCR errors in email addresses (e.g. © for @, .corn for .com)
 */
export function extractAndHealEmails(rawText: string): string[] {
  const emails: string[] = []

  let text = rawText
    // Fix OCR symbol errors for @
    .replace(/([a-zA-Z0-9._%+-]+)\s*[@©®*]\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})/g, '$1@$2.$3')
    .replace(/([a-zA-Z0-9._%+-]+)\s*\(c\)\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})/gi, '$1@$2.$3')
    .replace(/([a-zA-Z0-9._%+-]+)\s*\[at\]\s*([a-zA-Z0-9.-]+)\s*\[dot\]\s*([a-zA-Z]{2,})/gi, '$1@$2.$3')

  // Fix common TLD spelling mistakes made by OCR engines
  text = text.replace(/@([a-zA-Z0-9.-]+)\.(corn|coom|con|c0m|cm)\b/gi, '@$1.com')
  text = text.replace(/@([a-zA-Z0-9.-]+)\.(orq|orgg)\b/gi, '@$1.org')
  text = text.replace(/@([a-zA-Z0-9.-]+)\.(nct|ncl)\b/gi, '@$1.net')

  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
  const matches = text.match(emailRegex) || []

  for (const m of matches) {
    let cleaned = m.toLowerCase().trim()
    cleaned = cleaned.replace(/[.,;:]+$/, '')
    if (cleaned.includes('@') && cleaned.includes('.') && !emails.includes(cleaned)) {
      emails.push(cleaned)
    }
  }

  return emails
}

/**
 * Heals OCR digit errors in phone lines and extracts all valid contact numbers.
 */
export function extractAndHealPhones(rawLines: string[]): DetectedContactNumber[] {
  const results: DetectedContactNumber[] = []
  const seenDigits = new Set<string>()

  for (const line of rawLines) {
    const hasPhoneLabel = /(?:tel|phone|cell|mob|mobile|whatsapp|wa|fax|direct|contact|ph\b|\bt\b|\bm\b|\bo\b)/i.test(line)

    // Split multi-number lines on delimiters
    const segments = line.split(/[|/\\;•]/).map((s) => s.trim()).filter(Boolean)

    for (const segment of segments) {
      let healed = segment

      // If segment looks like a phone line, heal OCR character confusions in digits
      if (hasPhoneLabel || /\d{3,}/.test(segment) || /^\+/.test(segment)) {
        healed = healed
          .replace(/(?<=\d|\+|\s)[oO](?=\d|\s|$)/g, '0')
          .replace(/(?<=\d|\+|\s)[lI|](?=\d|\s|$)/g, '1')
          .replace(/(?<=\d|\+|\s)[sS](?=\d|\s|$)/g, '5')
          .replace(/(?<=\d|\+|\s)[bB](?=\d|\s|$)/g, '8')
      }

      // Match phone numbers: handles country codes, spaces, dashes, parentheses
      const phoneRegex = /(?:(?:\+|00)\d{1,4}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,5}(?:\s*(?:ext|x)\s*\d{1,5})?/g
      const matches = healed.match(phoneRegex) || []

      for (const m of matches) {
        const cleaned = m.trim().replace(/^[-.\s]+|[-.\s]+$/g, '')
        const digits = cleaned.replace(/\D/g, '')

        if (digits.length >= 7 && digits.length <= 16 && !seenDigits.has(digits)) {
          // Avoid matching 4-digit years like 2024
          if (!/^(19|20)\d{2}$/.test(digits)) {
            seenDigits.add(digits)

            let label: DetectedContactNumber['label'] = 'other'
            let formattedLabel = 'Phone'

            if (/mob|cell|wa|whatsapp|\bm\b/i.test(segment)) {
              label = 'mobile'
              formattedLabel = 'Mobile'
            } else if (/fax|\bf\b/i.test(segment)) {
              label = 'fax'
              formattedLabel = 'Fax'
            } else if (/office|work|\bo\b/i.test(segment)) {
              label = 'office'
              formattedLabel = 'Office'
            } else if (/tel|phone|\bt\b|\bph\b/i.test(segment)) {
              label = 'tel'
              formattedLabel = 'Tel'
            }

            results.push({
              number: cleaned,
              label,
              formattedLabel,
            })
          }
        }
      }
    }
  }

  return results
}

/**
 * Intelligent Business Card Parser
 * Extracts Name, Job Title, Company, Phone Numbers, Emails, and Website with high precision.
 */
export function parseBusinessCardText(
  text: string,
  linesData?: ParsedLineInfo[]
): ParsedBusinessCard {
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[•|\-_:;*]+\s*/, ''))
    .filter((l) => l.length > 0)

  // 1. Emails
  const foundEmails = extractAndHealEmails(text)

  // 2. Websites
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?(?:\/[^\s,;]*)?)/gi
  const foundWebsites: string[] = []
  const urlMatches = text.match(urlRegex) || []
  for (const m of urlMatches) {
    const cleaned = m.trim().replace(/[.,;:]+$/, '')
    const isEmailDomain = foundEmails.some((em) => em.includes(cleaned) || cleaned.includes(em))
    if (!isEmailDomain && !foundWebsites.includes(cleaned) && cleaned.includes('.')) {
      if (!cleaned.match(/\.(png|jpg|jpeg|gif|svg|pdf)$/i)) {
        foundWebsites.push(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`)
      }
    }
  }

  // 3. Phones
  const phoneNumbers = extractAndHealPhones(rawLines)
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

  // 4. Job Title
  let jobTitle = ''
  for (const line of rawLines) {
    const lower = line.toLowerCase()
    const isTitle = COMMON_TITLES.some((t) => {
      const reg = new RegExp(`\\b${t}\\b`, 'i')
      return reg.test(lower)
    })
    if (isTitle && !line.includes('@') && !line.match(/\d{5,}/) && line.length <= 60) {
      jobTitle = line
      break
    }
  }

  // 5. Company Name
  let company = ''
  for (const line of rawLines) {
    const lower = line.toLowerCase()
    const isCompany = COMPANY_SUFFIXES.some((suffix) => {
      const reg = new RegExp(`\\b${suffix}\\b`, 'i')
      return reg.test(lower)
    })
    if (isCompany && line !== jobTitle && !line.includes('@') && line.length <= 70) {
      company = line
      break
    }
  }

  // Fallback for company from email domain or website
  if (!company) {
    const pEmail = foundEmails[0]
    if (pEmail) {
      const domain = pEmail.split('@')[1]?.split('.')[0]
      if (domain && !['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'proton', 'mail', 'live', 'aol'].includes(domain)) {
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

  // 6. Address
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

  // 7. Full Name Extraction (Using Font Size Ranking & Structural Heuristics)
  let name = ''

  // If OCR provided line bounding box heights, sort candidate lines by font size!
  if (linesData && linesData.length > 0) {
    const candidates = linesData
      .filter((l) => {
        const t = l.text.trim()
        if (t.includes('@') || t.includes('www.') || t.includes('http')) return false
        if (phoneNumbers.some((p) => t.includes(p.number) || t.replace(/\D/g, '').length >= 6)) return false
        if (t === jobTitle || t === company || addressLines.includes(t)) return false
        const lettersOnly = t.replace(/[^a-zA-Z]/g, '')
        const words = t.split(/\s+/).filter(Boolean)
        return words.length >= 2 && words.length <= 4 && lettersOnly.length >= 4
      })
      .sort((a, b) => (b.height || 0) - (a.height || 0))

    if (candidates.length > 0) {
      name = candidates[0].text.trim().replace(/[.,:;*|]+$/, '')
    }
  }

  // Fallback name search if bounding box ranking didn't find one
  if (!name) {
    const candidateLines = rawLines.filter((line) => {
      if (line.includes('@') || line.includes('www.') || line.includes('http') || line.includes('.com')) return false
      if (phoneNumbers.some((p) => line.includes(p.number) || line.replace(/\D/g, '').length >= 6)) return false
      if (line === jobTitle || line === company || addressLines.includes(line)) return false

      const words = line.split(/\s+/).filter(Boolean)
      if (words.length >= 2 && words.length <= 4) {
        const letterRatio = line.replace(/[^a-zA-Z]/g, '').length / line.length
        return letterRatio > 0.75
      }
      return false
    })

    if (candidateLines.length > 0) {
      name = candidateLines[0].replace(/[.,:;*|]+$/, '')
    } else {
      // Last resort: Top non-contact line with letters
      for (const line of rawLines) {
        if (
          !line.includes('@') &&
          !line.match(/\d{4,}/) &&
          line !== jobTitle &&
          line !== company &&
          line.length >= 3 &&
          line.length <= 35
        ) {
          name = line.replace(/[.,:;*|]+$/, '')
          break
        }
      }
    }
  }

  // If job title was not found, check the line immediately below the Name
  if (!jobTitle && name) {
    const nameIndex = rawLines.findIndex((l) => l.includes(name))
    if (nameIndex >= 0 && nameIndex + 1 < rawLines.length) {
      const nextLine = rawLines[nameIndex + 1]
      if (
        !nextLine.includes('@') &&
        !phoneNumbers.some((p) => nextLine.includes(p.number)) &&
        nextLine !== company &&
        nextLine.length <= 50
      ) {
        jobTitle = nextLine
      }
    }
  }

  return {
    name,
    jobTitle,
    company,
    phone: primaryPhone,
    phoneNumbers,
    email: foundEmails[0] || '',
    emails: foundEmails,
    website: foundWebsites[0] || '',
    websites: foundWebsites,
    address,
    rawText: text.trim(),
  }
}

/**
 * Clean Canvas Image Resizer
 * Scales mobile photos to optimal OCR size (max 1800px) with clean bilinear resampling.
 * Preserves true RGB font anti-aliasing and avoids destructive pixel distortion.
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
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          resolve(e.target?.result as string)
          return
        }

        // Draw cleanly preserving natural font anti-aliasing
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        resolve(canvas.toDataURL('image/jpeg', 0.95))
      }
      img.onerror = () => reject(new Error('Failed to load card image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read card image file'))
    reader.readAsDataURL(file)
  })
}
