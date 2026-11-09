/**
 * Intelligent heuristics to parse text extracted from business card photos (OCR).
 */

export interface ParsedBusinessCard {
  name: string
  phone: string
  email: string
  company: string
  jobTitle: string
  website: string
  rawText: string
}

const COMMON_TITLES = [
  'ceo', 'cto', 'cfo', 'coo', 'founder', 'co-founder', 'president', 'vice president', 'vp',
  'director', 'manager', 'executive', 'consultant', 'specialist', 'officer', 'lead',
  'engineer', 'developer', 'designer', 'architect', 'analyst', 'associate', 'advisor',
  'representative', 'agent', 'broker', 'realtor', 'partner', 'attorney', 'doctor', 'physician',
  'surgeon', 'head of', 'general manager', 'sales manager', 'account executive'
]

const COMPANY_SUFFIXES = [
  'inc', 'inc.', 'llc', 'llc.', 'ltd', 'ltd.', 'corp', 'corp.', 'corporation', 'company', 'co.',
  'group', 'holdings', 'enterprises', 'solutions', 'technologies', 'agency', 'realty', 'real estate',
  'services', 'consulting', 'associates', 'studios', 'labs', 'properties'
]

export function parseBusinessCardText(text: string): ParsedBusinessCard {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0)

  let email = ''
  let phone = ''
  let website = ''
  let company = ''
  let jobTitle = ''
  let name = ''

  // 1. Extract Email
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
  for (const line of lines) {
    const match = line.match(emailRegex)
    if (match && !email) {
      email = match[1].toLowerCase()
      break
    }
  }

  // 2. Extract Phone Number
  // Look for lines with phone labels first (Tel, Phone, Cell, Mob, Call, Fax, M, T, P)
  const labeledPhoneRegex = /(?:tel|phone|cell|mob|mobile|call|p|m|t|ph|contact)[\s.:#*-]*((?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5})/i
  const generalPhoneRegex = /((?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,5})/

  for (const line of lines) {
    const labeledMatch = line.match(labeledPhoneRegex)
    if (labeledMatch) {
      phone = labeledMatch[1].trim()
      break
    }
  }

  if (!phone) {
    for (const line of lines) {
      // Avoid matching pure numbers like years or zip codes (at least 7 digits)
      const digits = line.replace(/\D/g, '')
      if (digits.length >= 7 && digits.length <= 15) {
        const match = line.match(generalPhoneRegex)
        if (match) {
          phone = match[1].trim()
          break
        }
      }
    }
  }

  // 3. Extract Website URL
  const websiteRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?(?:\/[^\s]*)?)/i
  for (const line of lines) {
    const match = line.match(websiteRegex)
    if (match) {
      const candidate = match[0].trim()
      // Make sure candidate is not part of the email address
      if (!email || !candidate.includes(email.split('@')[1])) {
        website = candidate.startsWith('http') ? candidate : `https://${candidate}`
        break
      }
    }
  }

  // 4. Extract Job Title
  for (const line of lines) {
    const lower = line.toLowerCase()
    const isTitle = COMMON_TITLES.some(title => lower.includes(title))
    if (isTitle && !line.includes('@') && !line.match(/\d{5,}/)) {
      jobTitle = line
      break
    }
  }

  // 5. Extract Company
  for (const line of lines) {
    const lower = line.toLowerCase()
    const isCompany = COMPANY_SUFFIXES.some(suffix => {
      const words = lower.split(/\s+/)
      return words.includes(suffix) || lower.endsWith(suffix)
    })
    if (isCompany && line !== jobTitle && !line.includes('@')) {
      company = line
      break
    }
  }

  // If company wasn't found by suffix, check if email domain provides a hint
  if (!company && email) {
    const domainPart = email.split('@')[1]?.split('.')[0]
    if (domainPart && !['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'proton'].includes(domainPart)) {
      // capitalize domain
      company = domainPart.charAt(0).toUpperCase() + domainPart.slice(1)
    }
  }

  // 6. Extract Name
  // Heuristic: Name is typically one of the first non-contact lines, 2-4 words, mostly alphabetic
  for (const line of lines) {
    // Skip if it contains email, phone, website, or is identical to jobTitle/company
    if (
      line.includes('@') ||
      line === jobTitle ||
      line === company ||
      line.includes('www.') ||
      line.includes('http') ||
      line.match(/\d{4,}/)
    ) {
      continue
    }

    // Check if line looks like a human name: 2 to 4 words, primarily letters
    const words = line.split(/\s+/).filter(Boolean)
    if (words.length >= 2 && words.length <= 4) {
      const hasOnlyNameChars = /^[a-zA-Z\s.,'-]+$/.test(line)
      if (hasOnlyNameChars) {
        name = line
        break
      }
    }
  }

  // Fallback for name if still empty
  if (!name && lines.length > 0) {
    for (const line of lines) {
      if (!line.includes('@') && !line.match(/\d{4,}/) && line !== jobTitle && line !== company) {
        name = line
        break
      }
    }
  }

  return {
    name,
    phone,
    email,
    company,
    jobTitle,
    website,
    rawText: text.trim(),
  }
}

/**
 * Scales down high-resolution smartphone camera photos to max 1600px
 * and optimizes contrast for faster and higher accuracy OCR.
 */
export async function preprocessCardImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX_DIM = 1600
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

        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      img.onerror = () => reject(new Error('Failed to load card image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read card image file'))
    reader.readAsDataURL(file)
  })
}

