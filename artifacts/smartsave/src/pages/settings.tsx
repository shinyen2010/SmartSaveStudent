import { useState } from "react";
import { useUser } from "@clerk/react";
import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  PiggyBank,
  Scale,
  Target,
  Leaf,
  Flame,
  Settings,
  Bell,
  User,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

const PERSONALITIES = [
  {
    id: "saver",
    label: "The Saver",
    icon: PiggyBank,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    selectedBg: "bg-blue-600",
    tagline: "Every ringgit saved is a victory",
    desc: "You avoid unnecessary spending, hunt for deals, and feel rewarded seeing your savings grow.",
  },
  {
    id: "balancer",
    label: "The Balancer",
    icon: Scale,
    color: "text-violet-600",
    bg: "bg-violet-50 border-violet-200",
    selectedBg: "bg-violet-600",
    tagline: "Enjoy today, plan for tomorrow",
    desc: "You believe in treating yourself while keeping an eye on the future. Balance is your superpower.",
  },
  {
    id: "goal_getter",
    label: "The Goal Getter",
    icon: Target,
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    selectedBg: "bg-green-600",
    tagline: "Laser-focused on milestones",
    desc: "Every purchase is weighed against your goals. You're motivated by hitting targets and celebrating wins.",
  },
  {
    id: "minimalist",
    label: "The Minimalist",
    icon: Leaf,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    selectedBg: "bg-emerald-600",
    tagline: "Less spending, more living",
    desc: "You prefer simplicity over stuff, experiences over things. Owning less brings you peace of mind.",
  },
  {
    id: "hustler",
    label: "The Hustler",
    icon: Flame,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    selectedBg: "bg-orange-600",
    tagline: "Always grinding smarter",
    desc: "You look for every opportunity to earn more and cut waste. Efficiency is everything.",
  },
];

const AGGRESSIVENESS = [
  { id: "conservative", label: "Conservative", desc: "Small, steady steps — low pressure savings" },
  { id: "moderate", label: "Moderate", desc: "Balanced approach to saving and spending" },
  { id: "aggressive", label: "Aggressive", desc: "Maximum savings, minimal discretionary spend" },
];

const ALERT_THRESHOLDS = [
  { value: 50, label: "50%" },
  { value: 75, label: "75%" },
  { value: 90, label: "90%" },
];

export default function SettingsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings();
  const { mutate: updateSettings, isPending } = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["getSettings"] });
        toast({ title: "Settings saved!", description: "Your preferences have been updated." });
      },
      onError: () => {
        toast({ title: "Error", description: "Could not save settings.", variant: "destructive" });
      },
    },
  });

  const [personality, setPersonality] = useState<string | null>(null);
  const [aggressiveness, setAggressiveness] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number | null>(null);
  const [digest, setDigest] = useState<boolean | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const currentPersonality = personality ?? settings?.moneyPersonality ?? "balancer";
  const currentAggressiveness = aggressiveness ?? settings?.savingsAggressiveness ?? "moderate";
  const currentThreshold = threshold ?? settings?.budgetAlertThreshold ?? 75;
  const currentDigest = digest ?? settings?.weeklyDigest ?? true;
  const currentDisplayName = displayName ?? settings?.displayName ?? "";

  const selectedPersonality = PERSONALITIES.find((p) => p.id === currentPersonality);

  function handleSave() {
    updateSettings({
      data: {
        moneyPersonality: currentPersonality,
        savingsAggressiveness: currentAggressiveness,
        budgetAlertThreshold: currentThreshold,
        weeklyDigest: currentDigest,
        displayName: currentDisplayName || null,
      },
    });
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-48 text-muted-foreground">Loading settings…</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Settings size={28} className="text-primary" /> Settings
            </h1>
            <p className="text-muted-foreground mt-1">Personalise how SmartSave works for you.</p>
          </div>
          <Button onClick={handleSave} disabled={isPending} className="rounded-full px-6">
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User size={18} /> Profile</CardTitle>
            <CardDescription>How you appear in SmartSave.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary text-lg">
                {user?.firstName?.[0] ?? user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ?? "U"}
              </div>
              <div>
                <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                <p className="text-sm text-muted-foreground">{user?.emailAddresses[0]?.emailAddress}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Display Name (optional)</Label>
              <Input
                placeholder={user?.firstName ?? "Your name"}
                value={currentDisplayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">Shows on your dashboard greeting instead of your full name.</p>
            </div>
          </CardContent>
        </Card>

        {/* Money Personality */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={18} /> Money Personality
            </CardTitle>
            <CardDescription>
              Choose the archetype that fits how you think about money. This shapes tips and insights across the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PERSONALITIES.map((p) => {
                const isSelected = currentPersonality === p.id;
                const Icon = p.icon;
                return (
                  <motion.button
                    key={p.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPersonality(p.id)}
                    className={[
                      "relative text-left rounded-2xl border-2 p-4 transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40",
                    ].join(" ")}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute top-3 right-3"
                        >
                          <CheckCircle2 size={18} className="text-primary" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
                      <Icon size={20} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                    </div>
                    <p className="font-bold text-sm">{p.label}</p>
                    <p className={`text-xs mt-0.5 ${isSelected ? "text-primary" : "text-muted-foreground"}`}>{p.tagline}</p>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{p.desc}</p>
                  </motion.button>
                );
              })}
            </div>

            {selectedPersonality && (
              <motion.div
                key={selectedPersonality.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 text-sm text-primary font-medium bg-primary/5 rounded-xl px-4 py-3"
              >
                <selectedPersonality.icon size={16} />
                You identified as <strong>{selectedPersonality.label}</strong> — {selectedPersonality.tagline.toLowerCase()}.
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Savings Approach */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank size={18} /> Savings Approach
            </CardTitle>
            <CardDescription>How aggressively do you want to save each month?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              {AGGRESSIVENESS.map((a) => {
                const isSelected = currentAggressiveness === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAggressiveness(a.id)}
                    className={[
                      "flex-1 text-left rounded-xl border-2 p-4 transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">{a.label}</p>
                      {isSelected && <CheckCircle2 size={16} className="text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell size={18} /> Notifications</CardTitle>
            <CardDescription>Control when and how SmartSave alerts you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Weekly Spending Digest</p>
                <p className="text-xs text-muted-foreground mt-0.5">Get a weekly summary of your spending activity.</p>
              </div>
              <Switch
                checked={currentDigest}
                onCheckedChange={(v) => setDigest(v)}
              />
            </div>

            <div className="space-y-3">
              <div>
                <p className="font-medium text-sm">Budget Alert Threshold</p>
                <p className="text-xs text-muted-foreground mt-0.5">Alert me when I've used this much of a budget.</p>
              </div>
              <div className="flex gap-2">
                {ALERT_THRESHOLDS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setThreshold(t.value)}
                    className={[
                      "flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all",
                      currentThreshold === t.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/40",
                    ].join(" ")}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save button (bottom) */}
        <div className="flex justify-end pb-4">
          <Button onClick={handleSave} disabled={isPending} size="lg" className="rounded-full px-8">
            {isPending ? "Saving…" : "Save All Changes"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
