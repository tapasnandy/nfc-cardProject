/**
 * High-Precision Business Card Classifier & OCR Healer
 * Uses Probabilistic Entity Scoring to distinguish:
 * - Full Name
 * - Job Title / Designation
 * - Company / Organization Name
 * - Phone Numbers
 * - Email Addresses
 * - Website & Address
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
  'ceo', 'cto', 'cfo', 'coo', 'cmo', 'cio', 'founder', 'co-founder', 'cofounder', 'president',
  'vice president', 'vp', 'managing director', 'executive director', 'general manager', 'gm',
  'director', 'assistant director', 'manager', 'assistant manager', 'branch manager', 'lead',
  'head of', 'sales director', 'sales manager', 'account manager', 'business development',
  'senior consultant', 'consultant', 'principal consultant', 'specialist', 'officer',
  'senior engineer', 'software engineer', 'civil engineer', 'mechanical engineer', 'engineer',
  'developer', 'designer', 'creative director', 'art director', 'architect', 'principal architect',
  'analyst', 'senior analyst', 'associate', 'senior associate', 'advisor', 'senior advisor',
  'representative', 'sales executive', 'executive', 'agent', 'broker', 'realtor', 'partner',
  'senior partner', 'managing partner', 'attorney', 'advocate', 'lawyer', 'counsel', 'legal counsel',
  'doctor', 'physician', 'surgeon', 'dr.', 'prof.', 'professor', 'lecturer', 'project manager',
  'marketing manager', 'product manager', 'coordinator', 'supervisor'
]

const COMPANY_KEYWORDS = [
  'ltd', 'ltd.', 'limited', 'inc', 'inc.', 'llc', 'llc.', 'corp', 'corp.', 'corporation',
  'company', 'co.', 'group', 'holdings', 'enterprises', 'enterprise', 'solutions', 'technologies',
  'technology', 'tech', 'agency', 'realty', 'real estate', 'properties', 'property', 'services',
  'consulting', 'consultancy', 'associates', 'associate', 'studios', 'studio', 'labs', 'lab',
  'ventures', 'venture', 'industries', 'industry', 'logistics', 'international', 'intl', 'pvt',
  'pvt.', 'private', 'plc', 'gmbh', 'co., ltd', 'co.,ltd', 'hospital', 'clinic', 'pharma',
  'bank', 'center', 'centre', 'builders', 'construction', 'developers', 'holdings', 'firm',
  'institute', 'school', 'academy', 'university', 'college', 'foundation', 'trust', 'global'
]

const NAME_HONORIFICS = [
  'dr.', 'dr', 'doctor', 'prof.', 'prof', 'professor', 'engr.', 'engr', 'engineer',
  'adv.', 'adv', 'advocate', 'mr.', 'mr', 'ms.', 'ms', 'mrs.', 'mrs', 'md.', 'md',
  'mohammad', 'mohammed', 'muhammad'
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
    .replace(/([a-zA-Z0-9._%+-]+)\s*[@©®*]\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})/g, '$1@$2.$3')
    .replace(/([a-zA-Z0-9._%+-]+)\s*\(c\)\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})/gi, '$1@$2.$3')
    .replace(/([a-zA-Z0-9._%+-]+)\s*\[at\]\s*([a-zA-Z0-9.-]+)\s*\[dot\]\s*([a-zA-Z]{2,})/gi, '$1@$2.$3')

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

    const segments = line.split(/[|/\\;•]/).map((s) => s.trim()).filter(Boolean)

    for (const segment of segments) {
      let healed = segment

      if (hasPhoneLabel || /\d{3,}/.test(segment) || /^\+/.test(segment)) {
        healed = healed
          .replace(/(?<=\d|\+|\s)[oO](?=\d|\s|$)/g, '0')
          .replace(/(?<=\d|\+|\s)[lI|](?=\d|\s|$)/g, '1')
          .replace(/(?<=\d|\+|\s)[sS](?=\d|\s|$)/g, '5')
          .replace(/(?<=\d|\+|\s)[bB](?=\d|\s|$)/g, '8')
      }

      const phoneRegex = /(?:(?:\+|00)\d{1,4}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,5}(?:\s*(?:ext|x)\s*\d{1,5})?/g
      const matches = healed.match(phoneRegex) || []

      for (const m of matches) {
        const cleaned = m.trim().replace(/^[-.\s]+|[-.\s]+$/g, '')
        const digits = cleaned.replace(/\D/g, '')

        if (digits.length >= 7 && digits.length <= 16 && !seenDigits.has(digits)) {
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
 * Probabilistic Entity Scoring Classifier for Business Card Text.
 * Accurately determines which line is Name, Job Title, or Company.
 */
export function parseBusinessCardText(
  text: string,
  linesData?: ParsedLineInfo[]
): ParsedBusinessCard {
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[•|\-_:;*~^+=]+\s*/, '').replace(/[•|\-_:;*~^+=]+$/, ''))
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

  // 4. Address detection
  const addressLines: string[] = []
  for (const line of rawLines) {
    const lower = line.toLowerCase()
    const hasAddressKw = ADDRESS_KEYWORDS.some((kw) => lower.includes(kw))
    if (hasAddressKw && !line.includes('@') && !phoneNumbers.some((p) => p.number === line)) {
      addressLines.push(line)
    }
  }
  const address = addressLines.slice(0, 2).join(', ')

  // -------------------------------------------------------------
  // 5. PROBABILISTIC ENTITY CLASSIFICATION (NAME vs TITLE vs COMPANY)
  // -------------------------------------------------------------
  // Filter out pure contact lines (emails, urls, pure phone numbers, address lines)
  const candidateLines = rawLines.filter((line) => {
    if (line.includes('@') || line.includes('www.') || line.startsWith('http')) return false
    if (phoneNumbers.some((p) => line.includes(p.number) || line.replace(/\D/g, '').length >= 7)) return false
    if (addressLines.includes(line)) return false
    return line.length >= 2 && line.length <= 80
  })

  // Extract hints from corporate email or website domain to recognize company name
  const corporateKeywords: string[] = []
  const pEmail = foundEmails[0]
  if (pEmail) {
    const domainPart = pEmail.split('@')[1]?.split('.')[0]
    if (domainPart && !['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'proton', 'mail', 'live'].includes(domainPart)) {
      corporateKeywords.push(domainPart.toLowerCase())
    }
  }
  if (foundWebsites.length > 0) {
    try {
      const hostPart = new URL(foundWebsites[0]).hostname.replace(/^www\./, '').split('.')[0]
      if (hostPart && hostPart.length >= 3 && !['linktr', 'bio', 'tapnet'].includes(hostPart)) {
        corporateKeywords.push(hostPart.toLowerCase())
      }
    } catch {
      // Ignore URL errors
    }
  }

  // Calculate scores for each candidate line
  interface ClassifiedCandidate {
    line: string
    height: number
    titleScore: number
    companyScore: number
    nameScore: number
  }

  const scoredCandidates: ClassifiedCandidate[] = candidateLines.map((line, idx) => {
    const lower = line.toLowerCase()
    const words = line.split(/\s+/).filter(Boolean)
    const letterRatio = line.replace(/[^a-zA-Z]/g, '').length / line.length

    // Find bounding box height if provided by OCR
    const matchingLineData = linesData?.find((l) => l.text.includes(line) || line.includes(l.text))
    const height = matchingLineData?.height || 16

    let titleScore = 0
    let companyScore = 0
    let nameScore = 0

    // --- TITLE SCORE ---
    const hasCommonTitle = COMMON_TITLES.some((t) => {
      const reg = new RegExp(`\\b${t}\\b`, 'i')
      return reg.test(lower)
    })
    if (hasCommonTitle) titleScore += 90
    if (lower.includes('senior') || lower.includes('lead') || lower.includes('head of')) titleScore += 30
    if (words.length >= 1 && words.length <= 5) titleScore += 20
    // Penalize company suffixes in title
    if (COMPANY_KEYWORDS.some((k) => lower.includes(k))) titleScore -= 60

    // --- COMPANY SCORE ---
    const hasCompanyKeyword = COMPANY_KEYWORDS.some((k) => {
      const reg = new RegExp(`\\b${k}\\b`, 'i')
      return reg.test(lower)
    })
    if (hasCompanyKeyword) companyScore += 80
    // Domain match bonus
    if (corporateKeywords.some((corp) => lower.includes(corp))) companyScore += 100
    // All CAPS bonus (e.g. "PRIME REALTY")
    if (line === line.toUpperCase() && line.length >= 4) companyScore += 25
    // Top line position bonus
    if (idx === 0) companyScore += 30
    // Penalize title words in company
    if (hasCommonTitle) companyScore -= 50

    // --- NAME SCORE ---
    // Names typically have 2-4 words, capitalized (e.g. "Alex Morgan")
    if (words.length >= 2 && words.length <= 4) nameScore += 40
    const isCapitalizedWords = words.every((w) => /^[A-Z][a-z]+$/.test(w) || /^[A-Z.]+$/.test(w))
    if (isCapitalizedWords) nameScore += 35
    // Honorific match bonus ("Dr.", "Mr.", "Engr.")
    if (NAME_HONORIFICS.some((h) => lower.startsWith(h) || lower.includes(h))) nameScore += 70
    // Font height bonus (names are printed largest on card)
    if (height > 20) nameScore += 50
    if (letterRatio > 0.8) nameScore += 20
    // Penalize title and company keywords in names
    if (hasCommonTitle) nameScore -= 70
    if (hasCompanyKeyword) nameScore -= 70

    return {
      line,
      height,
      titleScore,
      companyScore,
      nameScore,
    }
  })

  // Solve Entity Assignment
  let bestTitle = ''
  let bestCompany = ''
  let bestName = ''

  // 1. Assign Job Title (highest titleScore >= 50)
  const titleCandidate = [...scoredCandidates]
    .filter((c) => c.titleScore >= 50)
    .sort((a, b) => b.titleScore - a.titleScore)[0]
  if (titleCandidate) {
    bestTitle = titleCandidate.line
  }

  // 2. Assign Company (highest companyScore >= 40, not matching title)
  const companyCandidate = [...scoredCandidates]
    .filter((c) => c.line !== bestTitle && c.companyScore >= 40)
    .sort((a, b) => b.companyScore - a.companyScore)[0]
  if (companyCandidate) {
    bestCompany = companyCandidate.line
  }

  // 3. Assign Name (highest nameScore, not matching title or company)
  const nameCandidate = [...scoredCandidates]
    .filter((c) => c.line !== bestTitle && c.line !== bestCompany)
    .sort((a, b) => b.nameScore - a.nameScore)[0]
  if (nameCandidate) {
    bestName = nameCandidate.line
  }

  // Fallbacks if any remained unassigned
  if (!bestName && scoredCandidates.length > 0) {
    const fallback = scoredCandidates.find((c) => c.line !== bestTitle && c.line !== bestCompany)
    if (fallback) bestName = fallback.line
  }

  if (!bestCompany && corporateKeywords.length > 0) {
    const raw = corporateKeywords[0]
    bestCompany = raw.charAt(0).toUpperCase() + raw.slice(1)
  }

  return {
    name: bestName,
    jobTitle: bestTitle,
    company: bestCompany,
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
