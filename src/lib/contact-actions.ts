export interface ProfileContactData {
  name: string
  job_title?: string | null
  company?: string | null
  bio?: string | null
  profile_photo?: string | null
  photo_base64?: string | null
  photo_type?: string | null
  phone?: string | null
  email?: string | null
  whatsapp?: string | null
  website?: string | null
  linkedin?: string | null
  facebook?: string | null
  instagram?: string | null
  address?: string | null
}

/**
 * Validates and formats a phone number for the `tel:` protocol.
 * Preserves international country codes (e.g., +880, +1, +44).
 */
export function getCallUrl(phone?: string | null): string | null {
  if (!phone || typeof phone !== 'string') return null

  const trimmed = phone.trim()
  if (!trimmed) return null

  // Keep leading '+' if present for international dialing, then only keep digits
  const hasPlus = trimmed.startsWith('+')
  const digitsOnly = trimmed.replace(/[^0-9]/g, '')

  // Basic validation: phone numbers typically have 6 to 15 digits
  if (digitsOnly.length < 6 || digitsOnly.length > 16) {
    return null
  }

  return `tel:${hasPlus ? '+' : ''}${digitsOnly}`
}

/**
 * Normalizes a phone number for WhatsApp's official https://wa.me/ URL format.
 * WhatsApp requires international format with pure digits and NO leading '+', spaces, or hyphens.
 * (e.g., +880 1712-345678 becomes 8801712345678, +1 (555) 123-4567 becomes 15551234567).
 * Falls back to general phone if whatsapp is not specified.
 */
export function getWhatsAppUrl(
  whatsapp?: string | null,
  phone?: string | null
): string | null {
  const target = (whatsapp && whatsapp.trim()) || (phone && phone.trim())
  if (!target) return null

  // Remove leading zeros if entered as 00<country_code>
  let sanitized = target.trim()
  if (sanitized.startsWith('00')) {
    sanitized = sanitized.substring(2)
  }

  // Strip all non-digit characters including '+'
  const digitsOnly = sanitized.replace(/[^0-9]/g, '')

  // Must have a valid international length (7 to 15 digits)
  if (digitsOnly.length < 7 || digitsOnly.length > 16) {
    return null
  }

  return `https://wa.me/${digitsOnly}`
}

/**
 * Validates and normalizes website URLs.
 * Rejects unsafe schemes (javascript:, data:, vbscript:, file:).
 * Automatically prepends https:// if missing.
 */
export function getSafeWebsiteUrl(website?: string | null): string | null {
  if (!website || typeof website !== 'string') return null

  const trimmed = website.trim()
  if (!trimmed) return null

  // Block dangerous schemes
  const lower = trimmed.toLowerCase()
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return null
  }

  let finalUrl = trimmed
  if (!/^https?:\/\//i.test(finalUrl)) {
    finalUrl = `https://${finalUrl}`
  }

  try {
    const parsed = new URL(finalUrl)
    // Only permit http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    // Must have a valid host containing at least one dot or localhost
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return null
    }
    return parsed.href
  } catch {
    return null
  }
}

/**
 * Escapes special characters for vCard 3.0 fields according to RFC 2426.
 */
function escapeVCardValue(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * Generates a valid vCard 3.0 (.vcf) formatted string with UTF-8 character encoding.
 */
export function generateVCard(profile: ProfileContactData): string {
  const nameParts = (profile.name || '').trim().split(/\s+/)
  const lastName = nameParts.length > 1 ? nameParts.pop() || '' : ''
  const firstName = nameParts.join(' ')

  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`,
    `FN:${escapeVCardValue(profile.name)}`,
  ]

  if (profile.company) {
    lines.push(`ORG:${escapeVCardValue(profile.company)}`)
  }
  if (profile.job_title) {
    lines.push(`TITLE:${escapeVCardValue(profile.job_title)}`)
  }
  if (profile.phone) {
    const cleanPhone = profile.phone.trim()
    lines.push(`TEL;TYPE=CELL,VOICE:${cleanPhone}`)
  }
  if (profile.whatsapp && profile.whatsapp !== profile.phone) {
    const cleanWa = profile.whatsapp.trim()
    lines.push(`TEL;TYPE=WORK,MSG:${cleanWa}`)
  }
  if (profile.email) {
    lines.push(`EMAIL;TYPE=INTERNET,PREF:${profile.email.trim()}`)
  }

  const safeWeb = getSafeWebsiteUrl(profile.website)
  if (safeWeb) {
    lines.push(`URL;TYPE=WORK:${safeWeb}`)
  }
  if (profile.linkedin) {
    const safeLinkedin = getSafeWebsiteUrl(profile.linkedin)
    if (safeLinkedin) lines.push(`URL;TYPE=LinkedIn:${safeLinkedin}`)
  }
  if (profile.instagram) {
    const safeInstagram = getSafeWebsiteUrl(profile.instagram)
    if (safeInstagram) lines.push(`URL;TYPE=Instagram:${safeInstagram}`)
  }
  if (profile.facebook) {
    const safeFacebook = getSafeWebsiteUrl(profile.facebook)
    if (safeFacebook) lines.push(`URL;TYPE=Facebook:${safeFacebook}`)
  }
  if (profile.address) {
    lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(profile.address)};;;;`)
  }
  if (profile.bio) {
    lines.push(`NOTE:${escapeVCardValue(profile.bio)}`)
  }

  // Embed contact photo
  // iOS and Android contact apps REQUIRE binary base64 encoding (PHOTO;ENCODING=b;TYPE=JPEG:<base64>)
  // Most mobile contact importers completely ignore remote HTTP URLs (PHOTO;VALUE=URI:...) for privacy/security
  if (profile.photo_base64) {
    const pType = (profile.photo_type || 'JPEG').toUpperCase()
    const cleanBase64 = profile.photo_base64.replace(/\s+/g, '')
    lines.push(`PHOTO;ENCODING=b;TYPE=${pType}:${cleanBase64}`)
  } else if (profile.profile_photo && profile.profile_photo.startsWith('http')) {
    lines.push(`PHOTO;VALUE=URI:${profile.profile_photo}`)
  }

  lines.push('END:VCARD')
  return lines.join('\r\n')
}

/**
 * Generates a vCard 3.0 string with the profile photo downloaded and embedded as Base64 binary.
 * This guarantees that both Apple iOS Contacts and Android / MIUI Contacts will display
 * and save the contact photo when the user imports the .vcf file.
 */
export async function generateVCardWithPhoto(profile: ProfileContactData): Promise<string> {
  let photo_base64: string | null = profile.photo_base64 || null
  let photo_type: string = profile.photo_type || 'JPEG'

  if (!photo_base64 && profile.profile_photo && profile.profile_photo.startsWith('http')) {
    try {
      const res = await fetch(profile.profile_photo)
      if (res.ok) {
        const contentType = res.headers.get('content-type') || ''
        if (contentType.toLowerCase().includes('png')) {
          photo_type = 'PNG'
        } else {
          photo_type = 'JPEG'
        }
        const buffer = await res.arrayBuffer()
        // If image is reasonable size (< 3MB), convert to base64
        if (buffer.byteLength > 0 && buffer.byteLength <= 3 * 1024 * 1024) {
          photo_base64 = Buffer.from(buffer).toString('base64')
        }
      }
    } catch (err) {
      console.warn('Could not fetch profile photo for vCard embedding:', err)
    }
  }

  return generateVCard({
    ...profile,
    photo_base64,
    photo_type,
  })
}
