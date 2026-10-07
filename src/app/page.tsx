import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center px-6 border-b">
        <div className="font-bold text-xl tracking-tight">TapNet (NFC SaaS)</div>
        <nav className="ml-auto flex gap-4">
          <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4 flex items-center">
            Login
          </Link>
          <Link href="/register" className={cn(buttonVariants({ variant: "default" }))}>
            Get Started
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight mb-4">
          The Future of Business Cards
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-8">
          Manage your digital identity with our premium NFC business cards. Update your details anytime without replacing the physical card.
        </p>
        <div className="flex gap-4">
          <Link href="/register" className={cn(buttonVariants({ size: "lg", variant: "default" }))}>
            Start for free
          </Link>
          <Link href="/about" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
            Learn more
          </Link>
        </div>
      </main>
      <footer className="h-16 flex items-center justify-center border-t text-sm text-muted-foreground">
        © 2026 TapNet MVP. All rights reserved.
      </footer>
    </div>
  );
}
