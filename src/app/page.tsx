import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'
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
} from 'lucide-react'

const industries = [
  {
    icon: Building2Icon,
    title: 'Real Estate & Property Agents',
    description:
      'Share property listings, virtual tours, and capture client buying enquiries right during site visits and open houses.',
    badge: 'Real Estate & Housing',
    color: 'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50',
  },
  {
    icon: BriefcaseIcon,
    title: 'Corporate Sales & B2B Teams',
    description:
      'Equip field sales teams with cards linked to unique IDs. Every meeting and lead is automatically attributed to the salesperson.',
    badge: 'B2B & Enterprise',
    color: 'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50',
  },
  {
    icon: StethoscopeIcon,
    title: 'Doctors & Medical Consultants',
    description:
      'Provide patients and partners with clinic hours, chamber locations, telemedicine links, and direct consultation booking forms.',
    badge: 'Healthcare & Clinics',
    color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50',
  },
  {
    icon: UtensilsIcon,
    title: 'Restaurants & Hospitality',
    description:
      'Let dining guests view interactive menus, request catering quotes, leave 5-star Google Reviews, and access Wi-Fi in 1 tap.',
    badge: 'Food & Services',
    color: 'from-rose-500/10 to-pink-500/10 text-rose-600 dark:text-rose-400 border-rose-200/50',
  },
  {
    icon: UserCheck2Icon,
    title: 'Individuals & Executives',
    description:
      'Elevate your personal brand. Hand over your contact details with photo, social links, and portfolio in a sleek, memorable card.',
    badge: 'Executives & Founders',
    color: 'from-purple-500/10 to-violet-500/10 text-purple-600 dark:text-purple-400 border-purple-200/50',
  },
  {
    icon: GraduationCapIcon,
    title: 'Students & Freelancers',
    description:
      'Stand out at career fairs and meetups. Link directly to your GitHub, Behance, LinkedIn, and accept freelance project requests.',
    badge: 'Freelancers & Tech',
    color: 'from-cyan-500/10 to-sky-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200/50',
  },
]

const features = [
  {
    icon: CreditCardIcon,
    title: 'Unique Card ID Tracking',
    description:
      'Every physical card possesses a unique code (e.g. Card: AB12CD). Managers can see exactly which salesperson met the client.',
  },
  {
    icon: UserCheck2Icon,
    title: 'Integrated Lead Capture CRM',
    description:
      'Clients can submit enquiries right from the card, or salespeople can log meeting notes on the go. Leads sync to your dashboard.',
  },
  {
    icon: PhoneCallIcon,
    title: '1-Tap Direct Outreach',
    description:
      'Click to Call or launch WhatsApp chats with prospects straight from the CRM table. Follow up while interest is at its peak.',
  },
  {
    icon: TrendingUpIcon,
    title: 'CSV Export for External CRMs',
    description:
      'Seamlessly export all recorded meetings, prospect details, and notes to CSV for HubSpot, Salesforce, or Excel.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Dynamic Over-the-Air Updates',
    description:
      'Changed your phone number or title? Update your profile anytime online—no need to throw away or reprint physical cards.',
  },
  {
    icon: SparklesIcon,
    title: 'Save Contact with Picture',
    description:
      'Direct contact saving embeds your name, photo, job title, phone numbers, and socials cleanly into phone address books.',
  },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between px-4 sm:px-8 border-b bg-background/95 backdrop-blur-md">
        <Link href="/" className="font-extrabold text-xl tracking-tight flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
            T
          </span>
          <span>TapNet</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="text-xs sm:text-sm font-medium hover:text-foreground text-muted-foreground transition-colors px-2 py-1"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: 'default', size: 'sm' }),
              'text-xs sm:text-sm h-8 sm:h-9 px-3.5 sm:px-4 font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
            )}
          >
            Get Started Free
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_70%)]" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Smart NFC Business Cards &amp; Lead Generation Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
            The Digital Business Card That{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Captures Real Client Leads
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            From solo freelancers and doctors to corporate sales forces and real estate agencies.
            Share your profile in 1 tap, capture client enquiries on the spot, and track field sales meetings live in your manager dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'default' }),
                'w-full sm:w-auto font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-7 shadow-md'
              )}
            >
              <span>Create Your Card Free</span>
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'w-full sm:w-auto font-semibold rounded-xl px-7'
              )}
            >
              Sign In to Dashboard
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            <div className="p-3.5 rounded-2xl bg-card border shadow-xs">
              <p className="text-xl sm:text-2xl font-bold text-foreground">1 Tap</p>
              <p className="text-xs text-muted-foreground">NFC Contact Saving</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-card border shadow-xs">
              <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">100%</p>
              <p className="text-xs text-muted-foreground">Lead Attribution</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-card border shadow-xs">
              <p className="text-xl sm:text-2xl font-bold text-foreground">Zero</p>
              <p className="text-xs text-muted-foreground">Apps Required to Tap</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-card border shadow-xs">
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">Instant</p>
              <p className="text-xs text-muted-foreground">WhatsApp &amp; Call CRM</p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audiences & Use Cases Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12 sm:mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Tailored For Every Industry
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Built for Individuals, Teams &amp; Enterprise Sales
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Whether you are meeting prospective buyers at an exhibition or handing your contact info to a patient, TapNet accelerates the connection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((ind, idx) => {
            const Icon = ind.icon
            return (
              <div
                key={idx}
                className="bg-card border rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
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

                  <h3 className="text-lg font-bold text-foreground group-hover:text-blue-600 transition-colors">
                    {ind.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {ind.description}
                  </p>
                </div>

                <div className="pt-2 border-t flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                  <span>Explore use case</span>
                  <ArrowRightIcon className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it Works for Real Estate & Corporate Sales Teams */}
      <section className="py-16 sm:py-20 bg-muted/40 border-y px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Corporate Sales &amp; Lead Management
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              How Sales Teams Track Client Meetings Live
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              No more lost business cards or forgotten handshakes. Turn every field interaction into an actionable lead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                1
              </div>
              <h3 className="font-bold text-base text-foreground">Tap &amp; Connect</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sales rep meets a prospective customer and taps the physical NFC card on the customer’s phone. The digital card opens instantly.
              </p>
            </div>

            <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                2
              </div>
              <h3 className="font-bold text-base text-foreground">Enquiry or Meeting Entry</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The client submits their project inquiry, or the sales rep enters the client details on the spot via Quick Entry mode.
              </p>
            </div>

            <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                3
              </div>
              <h3 className="font-bold text-base text-foreground">Live Manager Tracking</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The lead appears in the company dashboard with Card ID attribution. Managers track client meetings, conversion rates, and 1-tap follow-ups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Powerful Feature Highlights */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Enterprise Features
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Engineered for High-Conversion Networking
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon
            return (
              <div key={idx} className="bg-card border rounded-2xl p-5 shadow-xs space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground">{feat.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-14 sm:py-18 bg-zinc-900 text-white px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Upgrade Your Networking &amp; Sales Pipeline?
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Get started today. Create your digital profile, program your NFC cards, and capture leads seamlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'default' }),
                'bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl px-8'
              )}
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'text-white border-zinc-700 hover:bg-zinc-800 rounded-xl px-8'
              )}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="h-16 flex items-center justify-between border-t text-xs text-muted-foreground px-6 sm:px-10">
        <span>© 2026 TapNet. Smart NFC Business Cards &amp; Lead Platform.</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="hover:text-foreground transition-colors">
            Register
          </Link>
        </div>
      </footer>
    </div>
  )
}
