import React, { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Clock, CheckCircle, ArrowUpCircle, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface SOSEvent {
  id: string;
  user_id: string;
  task_id: string | null;
  user_role: string;
  status: 'triggered' | 'safety_team_responded' | 'resolved' | 'escalated';
  initial_latitude: number;
  initial_longitude: number;
  current_latitude: number | null;
  current_longitude: number | null;
  triggered_at: string;
  is_silent_mode: boolean;
  profiles?: {
    full_name: string;
    phone: string | null;
  };
}

export const SafetyDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [sosEvents, setSOSEvents] = useState<SOSEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');

  useEffect(() => {
    fetchSOSEvents();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('sos-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_events',
        },
        () => {
          fetchSOSEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const fetchSOSEvents = async () => {
    try {
      let query = supabase
        .from('sos_events')
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(50);

      if (filter === 'active') {
        query = query.in('status', ['triggered', 'safety_team_responded']);
      } else if (filter === 'resolved') {
        query = query.in('status', ['resolved', 'escalated']);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSOSEvents((data as unknown as SOSEvent[]) || []);
    } catch (error) {
      console.error('Error fetching SOS events:', error);
    } finally {
      setLoading(false);
    }
  };

  const respondToSOS = async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('sos_events')
        .update({
          status: 'safety_team_responded',
          safety_team_member_id: user.id,
          safety_team_notified: true,
          safety_team_notified_at: new Date().toISOString(),
          responded_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      fetchSOSEvents();
    } catch (error) {
      console.error('Error responding to SOS:', error);
    }
  };

  const resolveEvent = async (eventId: string) => {
    try {
      await supabase
        .from('sos_events')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      fetchSOSEvents();
    } catch (error) {
      console.error('Error resolving event:', error);
    }
  };

  const escalateEvent = async (eventId: string) => {
    try {
      await supabase
        .from('sos_events')
        .update({
          status: 'escalated',
        })
        .eq('id', eventId);

      fetchSOSEvents();
    } catch (error) {
      console.error('Error escalating event:', error);
    }
  };

  const getStatusBadge = (status: SOSEvent['status']) => {
    const variants: Record<SOSEvent['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      triggered: { variant: 'destructive', label: 'TRIGGERED' },
      safety_team_responded: { variant: 'default', label: 'RESPONDING' },
      resolved: { variant: 'secondary', label: 'RESOLVED' },
      escalated: { variant: 'outline', label: 'ESCALATED' },
    };
    return variants[status];
  };

  const activeCount = sosEvents.filter(e => ['triggered', 'safety_team_responded'].includes(e.status)).length;

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-destructive" />
            {t('safetyDashboard')}
          </h1>
          <p className="text-muted-foreground">
            {t('activeSOSEvents')}: {activeCount}
          </p>
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'resolved'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {sosEvents.filter(e => e.status === 'triggered').length}
                </p>
                <p className="text-sm text-muted-foreground">Triggered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {sosEvents.filter(e => e.status === 'safety_team_responded').length}
                </p>
                <p className="text-sm text-muted-foreground">Responding</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {sosEvents.filter(e => e.status === 'resolved').length}
                </p>
                <p className="text-sm text-muted-foreground">{t('resolvedEvents')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <ArrowUpCircle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {sosEvents.filter(e => e.status === 'escalated').length}
                </p>
                <p className="text-sm text-muted-foreground">{t('escalatedEvents')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {sosEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium">No SOS Events</p>
              <p className="text-muted-foreground">All clear - no active emergencies</p>
            </CardContent>
          </Card>
        ) : (
          sosEvents.map((event) => {
            const statusInfo = getStatusBadge(event.status);
            return (
              <Card key={event.id} className={event.status === 'triggered' ? 'border-destructive' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      {event.is_silent_mode && (
                        <Badge variant="outline">Silent Mode</Badge>
                      )}
                      <Badge variant="secondary">
                        {event.user_role === 'poster' ? t('taskPoster') : t('taskDoer')}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(event.triggered_at), { addSuffix: true })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* User Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {event.profiles?.full_name || 'Unknown User'}
                        </p>
                        {event.profiles?.phone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {event.profiles.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">
                          {(event.current_latitude || event.initial_latitude).toFixed(6)},{' '}
                          {(event.current_longitude || event.initial_longitude).toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {['triggered', 'safety_team_responded'].includes(event.status) && (
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      {event.status === 'triggered' && (
                        <Button onClick={() => respondToSOS(event.id)}>
                          {t('respondToSOS')}
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => resolveEvent(event.id)}>
                        Mark Resolved
                      </Button>
                      <Button variant="destructive" onClick={() => escalateEvent(event.id)}>
                        Escalate
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SafetyDashboard;
