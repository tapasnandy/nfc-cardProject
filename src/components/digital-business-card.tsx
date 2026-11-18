import { 
  getCallUrl, 
  getWhatsAppUrl, 
  getSafeWebsiteUrl, 
  ProfileContactData 
} from '@/lib/contact-actions'
import { SaveContactButton } from '@/app/c/[shortCode]/save-contact-button'
import { 
  PhoneCallIcon, 
  MessageCircleIcon, 
  GlobeIcon, 
  MailIcon, 
  MapPinIcon 
} from 'lucide-react'
import { LinkedInIcon, InstagramIcon, FacebookIcon } from '@/components/icons'
import { LeadCaptureModal } from '@/components/lead-capture-modal'
import Link from 'next/link'

interface DigitalBusinessCardProps {
  profile: ProfileContactData
  previewMode?: boolean
  shortCode?: string
  cardId?: string
  organizationId?: string
  hasAiVision?: boolean
}

export function DigitalBusinessCard({
  profile,
  previewMode = false,
  shortCode,
  cardId,
  organizationId,
  hasAiVision,
}: DigitalBusinessCardProps) {
  const callUrl = getCallUrl(profile.phone)
  const whatsappUrl = getWhatsAppUrl(profile.whatsapp, profile.phone)
  const websiteUrl = getSafeWebsiteUrl(profile.website)

  const initials = (profile.name || 'User')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(p => p.charAt(0).toUpperCase())
    .join('') || 'U'

  // Extract clean host name for display on website button
  let displayHost = 'Visit site'
  if (websiteUrl) {
    try {
      displayHost = new URL(websiteUrl).hostname.replace(/^www\./, '')
    } catch {
      displayHost = 'Visit site'
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-zinc-900 sm:rounded-3xl shadow-xl overflow-hidden min-h-screen sm:min-h-0 border border-zinc-200 dark:border-zinc-800 transition-colors">
      
      {/* Decorative Banner Header */}
      <div className="h-32 bg-gradient-to-r from-[#0A1934] via-[#0E2A4D] to-[#13B1A5] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        {previewMode && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full">
            Live Preview
          </div>
        )}
      </div>

      <div className="px-5 sm:px-6 pb-8 pt-0 relative">
        
        {/* Prominent Profile Photo / Avatar with High-Priority Progressive Loading */}
        <div className="flex justify-center -mt-16 mb-4">
          <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-white dark:border-zinc-900 shadow-xl bg-zinc-100 dark:bg-zinc-800 ring-2 ring-black/5 flex items-center justify-center">
            {profile.profile_photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profile_photo}
                alt={profile.name || 'Profile'}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
                // @ts-expect-error fetchpriority is supported in modern browsers
                fetchpriority="high"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback-initials')
                  if (fallback) fallback.classList.remove('hidden')
                }}
              />
            ) : null}
            <div
              className={`avatar-fallback-initials ${
                profile.profile_photo ? 'hidden' : ''
              } flex h-full w-full items-center justify-center text-3xl font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-200 dark:bg-zinc-800 select-none`}
            >
              {initials}
            </div>
          </div>
        </div>

        {/* Identity & Headline Block */}
        <div className="text-center space-y-1 mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {profile.name || 'Anonymous Contact'}
          </h1>
          
          {(profile.job_title || profile.company) && (
            <p className="text-sm font-semibold text-[#13B1A5] dark:text-[#18C8BB]">
              {profile.job_title}
              {profile.job_title && profile.company ? ' • ' : ''}
              {profile.company}
            </p>
          )}

          {profile.bio && (
            <p className="text-sm text-zinc-600 dark:text-zinc-300 pt-2 leading-relaxed whitespace-pre-line max-w-sm mx-auto">
              {profile.bio}
            </p>
          )}
        </div>

        {/* ======================================================== */}
        {/* QUICK CONTACT ACTION BUTTONS (CALL, WHATSAPP, WEBSITE)   */}
        {/* ======================================================== */}
        {(callUrl || whatsappUrl || websiteUrl) && (
          <div className="mb-4">
            <div className={`grid gap-2 sm:gap-3 ${
              [callUrl, whatsappUrl, websiteUrl].filter(Boolean).length === 3
                ? 'grid-cols-3'
                : [callUrl, whatsappUrl, websiteUrl].filter(Boolean).length === 2
                ? 'grid-cols-2'
                : 'grid-cols-1'
            }`}>
              {/* 1. CALL BUTTON */}
              {callUrl && (
                <a
                  href={callUrl}
                  aria-label={`Call ${profile.name}`}
                  className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-900 dark:text-zinc-100 transition-all active:scale-[0.97] touch-manipulation border border-zinc-200/60 dark:border-zinc-700/60 shadow-sm"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white mb-1.5 shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <PhoneCallIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold tracking-tight">Call</span>
                </a>
              )}

              {/* 2. WHATSAPP BUTTON */}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Chat with ${profile.name} on WhatsApp`}
                  className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 text-emerald-950 dark:text-emerald-100 transition-all active:scale-[0.97] touch-manipulation border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-600 text-white mb-1.5 shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                    <MessageCircleIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold tracking-tight text-emerald-900 dark:text-emerald-200">
                    WhatsApp
                  </span>
                </a>
              )}

              {/* 3. WEBSITE BUTTON */}
              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${profile.name}'s website`}
                  className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-900 dark:text-zinc-100 transition-all active:scale-[0.97] touch-manipulation border border-zinc-200/60 dark:border-zinc-700/60 shadow-sm"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#13B1A5] text-white mb-1.5 shadow-sm shadow-[#13B1A5]/30 group-hover:scale-105 transition-transform">
                    <GlobeIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold tracking-tight">Website</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[80px] mt-0.5">
                    {displayHost}
                  </span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PRIMARY HERO BUTTONS: SAVE CONTACT & LEAD ENQUIRY        */}
        {/* ======================================================== */}
        <div className="space-y-2.5 mb-6">
          <SaveContactButton shortCode={shortCode} profile={profile} />
          <LeadCaptureModal
            cardId={cardId}
            profileId={profile.id}
            organizationId={organizationId || profile.organization_id || undefined}
            personName={profile.name}
            companyName={profile.company}
            hasAiVision={hasAiVision}
          />
        </div>

        {/* ======================================================== */}
        {/* SECONDARY CONTACT DETAILS & SOCIAL LINKS                 */}
        {/* ======================================================== */}
        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          
          {/* Email row */}
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100/80 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/40 text-zinc-900 dark:text-zinc-100 transition-colors"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#13B1A5]/15 dark:bg-[#13B1A5]/25 text-[#0F8A80] dark:text-[#18C8BB] shrink-0">
                <MailIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Email</p>
                <p className="text-sm font-medium truncate">{profile.email}</p>
              </div>
            </a>
          )}

          {/* Physical Address Card */}
          {profile.address && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/40 text-zinc-900 dark:text-zinc-100">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                <MapPinIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Office Address</p>
                <p className="text-sm font-medium whitespace-pre-line text-zinc-800 dark:text-zinc-200 mt-0.5">
                  {profile.address}
                </p>
              </div>
            </div>
          )}

          {/* Social Profiles Grid */}
          {(profile.linkedin || profile.instagram || profile.facebook) && (
            <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
              <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                Connect on Social Media
              </p>
              <div className="flex justify-center items-center gap-3">
                {profile.linkedin && (
                  <a
                    href={getSafeWebsiteUrl(profile.linkedin) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn Profile"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-blue-950/50 text-blue-700 dark:text-blue-400 transition-colors shadow-sm"
                  >
                    <LinkedInIcon className="w-5 h-5" />
                  </a>
                )}
                {profile.instagram && (
                  <a
                    href={getSafeWebsiteUrl(profile.instagram) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram Profile"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 hover:bg-pink-50 dark:bg-zinc-800 dark:hover:bg-pink-950/50 text-pink-600 dark:text-pink-400 transition-colors shadow-sm"
                  >
                    <InstagramIcon className="w-5 h-5" />
                  </a>
                )}
                {profile.facebook && (
                  <a
                    href={getSafeWebsiteUrl(profile.facebook) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook Profile"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-100 hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 transition-colors shadow-sm"
                  >
                    <FacebookIcon className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer Brand */}
        <div className="mt-8 text-center pb-2 flex justify-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors"
          >
            <span className="text-[10px] uppercase tracking-wider">Powered by</span>
            <span className="font-extrabold text-zinc-800 dark:text-zinc-200 text-xs tracking-tight">
              tap<span className="text-[#13B1A5]">qori</span>
            </span>
          </Link>
        </div>

      </div>
    </div>
  )
}
