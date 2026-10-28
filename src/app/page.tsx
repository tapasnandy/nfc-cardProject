import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center justify-between px-4 sm:px-6 border-b bg-background/95 backdrop-blur-md">
        <Link href="/" className="font-bold text-lg sm:text-xl tracking-tight">
          TapNet
        </Link>
        <nav className="flex items-center gap-3 sm:gap-4">
          <Link href="/login" className="text-xs sm:text-sm font-medium hover:underline underline-offset-4 flex items-center px-2 py-1">
            Login
          </Link>
          <Link href="/register" className={cn(buttonVariants({ variant: "default", size: "sm" }), "text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4")}>
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20 text-center max-w-4xl mx-auto w-full">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-primary/10 text-primary mb-6">
          ✨ Next-Gen Contact Sharing
        </span>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
          The Future of <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Business Cards</span>
        </h1>
        <p className="text-sm sm:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
          Manage your digital identity with smart NFC business cards. Update your details anytime and share contacts instantly with a single tap or scan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto max-w-xs sm:max-w-none">
          <Link href="/register" className={cn(buttonVariants({ size: "lg", variant: "default" }), "w-full sm:w-auto font-semibold")}>
            Start for free
          </Link>
          <Link href="/login" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full sm:w-auto font-semibold")}>
            Access Dashboard
          </Link>
        </div>
      </main>

      <footer className="h-16 flex items-center justify-center border-t text-xs text-muted-foreground px-4 text-center">
        © 2026 TapNet. All rights reserved.
      </footer>
    </div>
  );
}
