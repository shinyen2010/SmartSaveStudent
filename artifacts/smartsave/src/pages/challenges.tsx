import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, PlusCircle, Filter, ChevronDown, CheckCircle2, Trophy, Lock } from "lucide-react";
import { useListChallenges, useListAchievements } from "@workspace/api-client-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

export default function Challenges() {
  const { data: challenges, isLoading: isLoadingChallenges } = useListChallenges();
  const { data: achievements, isLoading: isLoadingAchievements } = useListAchievements();

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight" data-testid="challenges-title">Challenges & XP</h1>
            <p className="text-muted-foreground mt-1">Level up your financial habits.</p>
          </div>
          <Button size="lg" className="rounded-full shadow-lg hover-elevate bg-secondary text-secondary-foreground hover:bg-secondary/90" data-testid="btn-add-challenge">
            <PlusCircle className="mr-2 h-4 w-4" /> New Challenge
          </Button>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="text-primary" /> Active Challenges
          </h2>
          
          {isLoadingChallenges ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
            </div>
          ) : challenges && challenges.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {challenges.map(challenge => (
                <Card key={challenge.id} className="overflow-hidden hover-elevate transition-all border-none shadow-md">
                  <div className="h-2 w-full bg-muted">
                    <div 
                      className="h-full bg-secondary transition-all duration-1000" 
                      style={{ width: `${Math.min(challenge.percentComplete || 0, 100)}%` }} 
                    />
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{challenge.name}</CardTitle>
                        <CardDescription className="mt-1">{challenge.description}</CardDescription>
                      </div>
                      <Badge variant="outline" className="font-bold bg-primary/10 text-primary border-primary/20">
                        +{challenge.xpReward} XP
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">${challenge.currentAmount.toFixed(2)} / ${challenge.targetAmount.toFixed(2)}</span>
                      <span className="text-muted-foreground">{challenge.percentComplete?.toFixed(0)}%</span>
                    </div>
                    {challenge.endDate && (
                      <p className="text-xs text-muted-foreground">Ends {format(new Date(challenge.endDate), 'MMM d, yyyy')}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy size={48} className="text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-bold mb-2">No active challenges</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-6">Start a savings challenge to earn XP and level up faster.</p>
                <Button variant="outline">Browse Challenges</Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 pt-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="text-accent" /> Achievement Badges
          </h2>
          
          {isLoadingAchievements ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : achievements && achievements.length > 0 ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
              {achievements.map(badge => (
                <div 
                  key={badge.id} 
                  className={`bg-card border rounded-2xl p-4 flex flex-col items-center text-center transition-all ${badge.isUnlocked ? 'hover-elevate hover:border-primary/50' : 'opacity-60 grayscale'}`}
                >
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-3 ${badge.isUnlocked ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {badge.isUnlocked ? <Trophy size={28} /> : <Lock size={28} />}
                  </div>
                  <h4 className="font-bold text-sm leading-tight">{badge.name}</h4>
                  {badge.isUnlocked ? (
                    <Badge variant="secondary" className="mt-2 text-[10px] bg-accent/10 text-accent">Unocked</Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground mt-2 font-medium">Locked</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No achievements found.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
