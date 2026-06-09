import { Link } from "wouter";
import { TrendingUp, Target, PieChart, Trophy, Zap, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: PieChart, title: "Smart Budget Planner", desc: "Set category limits and get alerted before you overspend." },
  { icon: Target, title: "Savings Goals", desc: "Save for a laptop, trip, or emergency fund with visual progress." },
  { icon: Trophy, title: "Challenges & XP", desc: "Earn XP by completing savings challenges and unlocking achievements." },
  { icon: TrendingUp, title: "Spending Insights", desc: "See where your money goes with charts and a monthly forecast." },
];

const perks = [
  "Financial health score updated in real time",
  "Budget alerts before you overspend",
  "End-of-month spending forecast",
  "Achievement badges and XP system",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl">
            <TrendingUp size={22} />
          </div>
          <span className="text-xl font-black tracking-tight">SmartSave</span>
          <span className="hidden sm:inline text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-1">Student</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
          <Zap size={14} /> Built for students, by design
        </div>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-tight mb-6">
          Spend Wisely.<br />
          <span className="text-primary">Save Smarter.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          SmartSave Student is the personal finance companion that helps you track every ringgit, hit your savings goals, and build money habits that actually stick.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="rounded-full px-8 text-lg h-14 shadow-lg" asChild>
            <Link href="/sign-up">
              Start for Free <ArrowRight className="ml-2" size={18} />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-8 text-lg h-14" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </section>

      {/* Perks strip */}
      <section className="bg-primary/5 border-y border-primary/10 py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {perks.map((p) => (
            <div key={p} className="flex items-center gap-3 text-sm font-medium">
              <CheckCircle size={18} className="text-primary shrink-0" />
              {p}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-black text-center mb-12">Everything you need to stay on track</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border rounded-2xl p-6 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <Icon size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="bg-primary rounded-3xl p-12 max-w-2xl mx-auto text-primary-foreground">
          <h2 className="text-3xl font-black mb-4">Ready to take control?</h2>
          <p className="opacity-80 mb-8 text-lg">Join students who are already saving smarter every day.</p>
          <Button size="lg" className="rounded-full px-10 bg-white text-primary hover:bg-white/90 font-bold text-lg h-14" asChild>
            <Link href="/sign-up">Create Free Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
            <TrendingUp size={14} />
          </div>
          <span className="font-bold text-foreground">SmartSave Student</span>
        </div>
        <p>Spend Wisely. Save Smarter.</p>
      </footer>
    </div>
  );
}
