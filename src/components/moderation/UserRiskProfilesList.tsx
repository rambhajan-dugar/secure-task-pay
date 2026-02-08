import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  User,
  AlertTriangle,
  Ban,
  Unlock,
  Shield,
  MessageSquare,
  Scale,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UserRiskProfileData {
  userId: string;
  fullName: string;
  email?: string;
  avatarUrl?: string;
  createdAt: Date;
  // Risk metrics
  disputesRaised: number;
  disputesLost: number;
  sosEvents: number;
  sosMisuse: number;
  flaggedMessagesSent: number;
  flaggedMessagesReceived: number;
  // Status
  isFrozen: boolean;
  frozenAt?: Date;
  frozenReason?: string;
  // Computed
  riskScore: number;
  recentTrend: 'improving' | 'stable' | 'worsening';
}

interface UserRiskProfilesListProps {
  profiles: UserRiskProfileData[];
  onFreeze: (userId: string) => void;
  onUnfreeze: (userId: string) => void;
  onViewDetails: (userId: string) => void;
}

export const UserRiskProfilesList: React.FC<UserRiskProfilesListProps> = ({
  profiles,
  onFreeze,
  onUnfreeze,
  onViewDetails,
}) => {
  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: 'Critical', color: 'text-destructive', bg: 'bg-destructive' };
    if (score >= 50) return { label: 'High', color: 'text-destructive', bg: 'bg-destructive/70' };
    if (score >= 30) return { label: 'Medium', color: 'text-warning', bg: 'bg-warning' };
    if (score >= 10) return { label: 'Low', color: 'text-info', bg: 'bg-info' };
    return { label: 'Minimal', color: 'text-success', bg: 'bg-success' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="w-4 h-4 text-success" />;
      case 'worsening':
        return <TrendingUp className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  if (profiles.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No at-risk users</p>
      </div>
    );
  }

  // Sort by risk score descending
  const sortedProfiles = [...profiles].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-3">
        {sortedProfiles.map((profile) => {
          const risk = getRiskLevel(profile.riskScore);
          
          return (
            <Card 
              key={profile.userId}
              className={cn(
                'overflow-hidden',
                profile.isFrozen && 'border-destructive/50 bg-destructive/5'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {profile.avatarUrl ? (
                      <img 
                        src={profile.avatarUrl} 
                        alt={profile.fullName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="font-medium truncate cursor-pointer hover:underline"
                        onClick={() => onViewDetails(profile.userId)}
                      >
                        {profile.fullName}
                      </span>
                      {profile.isFrozen && (
                        <Badge variant="destructive">Frozen</Badge>
                      )}
                      {getTrendIcon(profile.recentTrend)}
                    </div>

                    {/* Risk Score Bar */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('text-xs font-medium', risk.color)}>
                        {risk.label} Risk
                      </span>
                      <div className="flex-1 max-w-32">
                        <Progress 
                          value={profile.riskScore} 
                          className="h-2"
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {profile.riskScore}%
                      </span>
                    </div>

                    {/* Metrics */}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Scale className="w-3 h-3" />
                        {profile.disputesRaised} disputes ({profile.disputesLost} lost)
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {profile.sosEvents} SOS ({profile.sosMisuse} misuse)
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {profile.flaggedMessagesSent} flags sent
                      </span>
                    </div>

                    {/* Frozen reason */}
                    {profile.isFrozen && profile.frozenReason && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        {profile.frozenReason}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {profile.isFrozen ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onUnfreeze(profile.userId)}
                      >
                        <Unlock className="w-3 h-3 mr-1" />
                        Unfreeze
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => onFreeze(profile.userId)}
                        disabled={profile.riskScore < 30}
                      >
                        <Ban className="w-3 h-3 mr-1" />
                        Freeze
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default UserRiskProfilesList;
