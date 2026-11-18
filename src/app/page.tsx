import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { BrandLogo } from '@/components/brand-logo'
import {
  CreditCardIcon,
  UserCheck2Icon,
  Building2Icon,
  StethoscopeIcon,
  UtensilsIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  PhoneCallIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowRightIcon,
  ScanTextIcon,
  CheckCircle2Icon,
  SmartphoneIcon,
  ZapIcon,
} from 'lucide-react'

const industries = [
  {
    icon: Building2Icon,
    title: 'Real Estate & Property Agents',
    description:
      'Share property brochures, virtual tours, and capture homebuyer leads right during site visits and open house meetings.',
    badge: 'Real Estate',
    color: 'from-[#13B1A5]/15 to-[#0A1934]/10 text-[#0F8A80] dark:text-[#18C8BB] border-[#13B1A5]/30',
  },
  {
    icon: BriefcaseIcon,
    title: 'Corporate Sales & B2B Teams',
    description:
      'Equip field sales forces with smart cards. Every meeting, lead, and visiting card scan is automatically attributed to the salesperson.',
    badge: 'B2B & Enterprise',
    color: 'from-[#0A1934]/15 to-[#13B1A5]/10 text-[#0A1934] dark:text-[#18C8BB] border-[#0A1934]/20',
  },
  {
    icon: StethoscopeIcon,
    title: 'Doctors & Medical Consultants',
    description:
      'Provide patients and partners with clinic hours, chamber locations, telemedicine links, and direct consultation booking in 1 tap.',
    badge: 'Healthcare & Clinics',
    color: 'from-[#13B1A5]/15 to-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300/30',
  },
  {
    icon: UtensilsIcon,
    title: 'Restaurants & Hospitality',
    description:
      'Let dining guests view interactive menus, request catering quotes, leave 5-star Google Reviews, and access Wi-Fi in 1 instant tap.',
    badge: 'Food & Hospitality',
    color: 'from-amber-500/15 to-[#13B1A5]/10 text-amber-700 dark:text-amber-400 border-amber-300/30',
  },
  {
    icon: UserCheck2Icon,
    title: 'Individuals & Executives',
    description:
      'Elevate your personal brand. Hand over your contact details with photo, portfolio, and socials in a memorable modern card.',
    badge: 'Founders & Leaders',
    color: 'from-[#0A1934]/20 to-[#13B1A5]/20 text-[#0A1934] dark:text-[#13B1A5] border-[#13B1A5]/30',
  },
  {
    icon: GraduationCapIcon,
    title: 'Freelancers & Consultants',
    description:
      'Stand out at events and client pitches. Link directly to your portfolio, GitHub, WhatsApp, and receive client inquiries on the go.',
    badge: 'Consultants & Tech',
    color: 'from-[#13B1A5]/15 to-sky-500/10 text-teal-700 dark:text-[#18C8BB] border-teal-300/30',
  },
]

const features = [
  {
    icon: CreditCardIcon,
    title: 'Unique Card ID & Rep Attribution',
    description:
      'Every card possesses a unique code (e.g. Card: AB12CD). Managers track exactly which salesperson held each client meeting.',
  },
  {
    icon: ScanTextIcon,
    title: 'AI Business Card Vision Scanner',
    description:
      'Snap a photo of any physical visiting card. Tapqori AI automatically extracts Name, Job Title, Company, Phone & Email with 100% accuracy.',
  },
  {
    icon: UserCheck2Icon,
    title: 'Integrated Lead Capture CRM',
    description:
      'Clients can submit enquiries right from the card, or sales reps can log prospect details on the spot. All leads sync live to the manager dashboard.',
  },
  {
    icon: PhoneCallIcon,
    title: '1-Tap Direct Outreach',
    description:
      'Click to Call or launch WhatsApp conversations with prospects straight from the CRM table while meeting excitement is at its peak.',
  },
  {
    icon: TrendingUpIcon,
    title: 'Instant CSV Export',
    description:
      'Export recorded meetings, prospect details, and notes in one click for HubSpot, Salesforce, Zoho, or Microsoft Excel.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Dynamic Over-the-Air Updates',
    description:
      'Changed your phone number or title? Update your profile anytime online—no need to throw away or reprint physical cards.',
  },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-[#13B1A5]/20 selection:text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 flex h-16 sm:h-20 items-center justify-between px-4 sm:px-8 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <BrandLogo size="md" />

        <nav className="flex items-center gap-2.5 sm:gap-4">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-semibold hover:text-[#13B1A5] text-muted-foreground transition-colors px-2.5 py-1.5 rounded-lg"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: 'default', size: 'sm' }),
              'text-xs sm:text-sm h-9 sm:h-10 px-3.5 sm:px-5 font-bold rounded-xl bg-[#13B1A5] hover:bg-[#109F94] text-white shadow-sm shadow-[#13B1A5]/25 transition-all'
            )}
          >
            Get Started Free
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-28 border-b border-border/60">
        {/* Ambient Brand Gradient Background */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(19,177,165,0.18),transparent_70%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#13B1A5]/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#0A1934]/10 dark:bg-[#13B1A5]/5 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6 sm:space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#13B1A5]/10 text-[#0F8A80] dark:text-[#18C8BB] border border-[#13B1A5]/25 shadow-xs">
            <SparklesIcon className="w-3.5 h-3.5 text-[#13B1A5]" />
            <span>Smart NFC Identity &amp; AI-Powered Lead Capture</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] max-w-4xl mx-auto text-balance">
            The Smart Business Card That{' '}
            <span className="bg-gradient-to-r from-[#0A1934] via-[#0E2A4D] to-[#13B1A5] dark:from-white dark:via-[#A5F3ED] dark:to-[#13B1A5] bg-clip-text text-transparent">
              Captures Real Client Leads
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance">
            Share your profile in 1 tap, scan physical visiting cards with instant AI vision,
            and monitor field meetings live in your company manager dashboard.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 justify-center items-center pt-2 max-w-md sm:max-w-none mx-auto w-full">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'default' }),
                'w-full sm:w-auto h-12 sm:h-13 px-8 font-bold rounded-2xl bg-[#13B1A5] hover:bg-[#109F94] text-white shadow-lg shadow-[#13B1A5]/25 transition-all text-sm sm:text-base flex items-center justify-center gap-2'
              )}
            >
              <span>Create Your Card Free</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'w-full sm:w-auto h-12 sm:h-13 px-8 font-bold rounded-2xl border-border/80 hover:bg-[#13B1A5]/10 hover:border-[#13B1A5]/40 transition-all text-sm sm:text-base'
              )}
            >
              Sign In to Dashboard
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-8 sm:pt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto text-left">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <SmartphoneIcon className="w-3.5 h-3.5 text-[#13B1A5]" />
                <span>NFC Contact Save</span>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground">1 Tap</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <ScanTextIcon className="w-3.5 h-3.5 text-[#13B1A5]" />
                <span>AI Card OCR</span>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0F8A80] dark:text-[#18C8BB]">100%</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <ZapIcon className="w-3.5 h-3.5 text-[#13B1A5]" />
                <span>Apps Required</span>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-foreground">Zero</p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                <TrendingUpIcon className="w-3.5 h-3.5 text-[#13B1A5]" />
                <span>Lead Tracking</span>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-[#0F8A80] dark:text-[#18C8BB]">Live</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase: AI Vision + Lead Capture */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl p-6 sm:p-10 border border-[#13B1A5]/30 bg-gradient-to-br from-[#0A1934] via-[#0E2A4D] to-[#0A1934] text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#13B1A5]/25 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#13B1A5]/20 text-[#36E5D7] border border-[#13B1A5]/40">
                <ScanTextIcon className="w-3.5 h-3.5" />
                <span>Smart Business Card Scanner</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                Never lose a paper card again. Let AI scan &amp; classify on the spot.
              </h2>

              <p className="text-sm text-zinc-300 leading-relaxed">
                When a visitor hands you their paper card, simply snap a photo. Tapqori’s AI Vision detects the Full Name, Job Title, Company, Phone numbers, and Email in seconds—saving it straight to your lead pipeline.
              </p>

              <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-zinc-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2Icon className="w-4 h-4 text-[#36E5D7] shrink-0" />
                  <span>Separates Person Name from Company branding</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2Icon className="w-4 h-4 text-[#36E5D7] shrink-0" />
                  <span>Extracts Phone numbers with international country codes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2Icon className="w-4 h-4 text-[#36E5D7] shrink-0" />
                  <span>Leaves meeting notes free for your personal follow-up notes</span>
                </li>
              </ul>
            </div>

            {/* Interactive Visual Card Mockup */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[11px] font-mono text-[#36E5D7] bg-[#13B1A5]/20 px-2 py-0.5 rounded-md border border-[#13B1A5]/30">
                  AI Active • 100% Accuracy
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-white/10 space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Detected Contact</span>
                  <p className="text-sm font-bold text-white">Alexander Vance</p>
                  <p className="text-xs text-[#36E5D7]">Managing Director • Apex Global Real Estate</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/10">
                    <span className="text-[10px] text-zinc-400 uppercase">Phone</span>
                    <p className="font-mono text-white text-[11px] truncate">+1 (555) 234-8900</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/10">
                    <span className="text-[10px] text-zinc-400 uppercase">Email</span>
                    <p className="font-mono text-white text-[11px] truncate">vance@apexreal.com</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#13B1A5]/20 border border-[#13B1A5]/40 text-center">
                  <span className="text-xs font-semibold text-[#36E5D7] flex items-center justify-center gap-1.5">
                    <CheckCircle2Icon className="w-3.5 h-3.5" />
                    Saved to Dashboard with Card ID attribution
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audiences & Use Cases Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-3 mb-10 sm:mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0F8A80] dark:text-[#18C8BB]">
            Built For High-Impact Networking
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Tailored for Professionals, Teams &amp; Enterprise Sales
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Whether you are meeting prospective buyers at an exhibition or giving your contact info to a patient, Tapqori accelerates the connection.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {industries.map((ind, idx) => {
            const Icon = ind.icon
            return (
              <div
                key={idx}
                className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group hover:border-[#13B1A5]/40"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border bg-gradient-to-br ${ind.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      {ind.badge}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-[#0F8A80] dark:group-hover:text-[#18C8BB] transition-colors">
                    {ind.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {ind.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center text-xs font-bold text-[#0F8A80] dark:text-[#18C8BB]">
                  <span>Explore workflow</span>
                  <ArrowRightIcon className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it Works for Real Estate & Corporate Sales Teams */}
      <section className="py-14 sm:py-20 bg-muted/40 border-y border-border/70 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10 sm:space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F8A80] dark:text-[#18C8BB]">
              Live Sales Pipeline
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              How Sales Teams Track Client Meetings Live
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              No more lost business cards or forgotten handshakes. Turn every field interaction into an actionable lead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#0A1934] text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                1
              </div>
              <h3 className="font-bold text-base text-foreground">Tap &amp; Connect</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Sales rep meets a prospective customer and taps the physical NFC card on the customer’s phone. The digital card opens in milliseconds.
              </p>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#13B1A5] text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                2
              </div>
              <h3 className="font-bold text-base text-foreground">Enquiry or Card Scan</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                The client submits their project inquiry, or the sales rep snaps the customer&apos;s paper card with the AI Vision scanner.
              </p>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#0F2A4A] text-[#18C8BB] font-extrabold flex items-center justify-center text-sm shadow-xs border border-[#13B1A5]/30">
                3
              </div>
              <h3 className="font-bold text-base text-foreground">Live Manager Tracking</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                The lead appears in the company dashboard with unique Card ID attribution. Managers track client meetings, conversion rates, and 1-tap follow-ups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Powerful Feature Highlights */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-3 mb-10 sm:mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0F8A80] dark:text-[#18C8BB]">
            Enterprise Grade
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Engineered for High-Conversion Networking
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon
            return (
              <div key={idx} className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#13B1A5]/15 text-[#0F8A80] dark:text-[#18C8BB] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground">{feat.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-14 sm:py-20 bg-gradient-to-r from-[#0A1934] via-[#0E2A4D] to-[#0A1934] text-white px-4 sm:px-6 border-t border-[#13B1A5]/30">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-balance">
            Ready to Upgrade Your Networking &amp; Sales Pipeline?
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 max-w-xl mx-auto text-balance">
            Get started today. Create your digital profile, program your NFC cards, and capture leads seamlessly with Tapqori.
          </p>
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center max-w-xs sm:max-w-none mx-auto w-full">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'default' }),
                'w-full sm:w-auto h-12 px-8 bg-[#13B1A5] hover:bg-[#109F94] text-white font-bold rounded-2xl shadow-lg shadow-[#13B1A5]/30'
              )}
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'w-full sm:w-auto h-12 px-8 text-white border-white/20 hover:bg-white/10 rounded-2xl'
              )}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/80 px-4 sm:px-8 text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span className="hidden sm:inline text-zinc-400">•</span>
            <span>© 2026 Tapqori. Smart NFC Business Cards &amp; Lead Platform.</span>
          </div>

          <div className="flex items-center gap-5 font-medium">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
