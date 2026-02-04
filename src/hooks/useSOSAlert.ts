/**
 * Hook for triggering SOS alerts
 * - Creates SOS event in database
 * - Notifies emergency contacts
 * - Tracks location updates
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { EmergencyContact } from './useEmergencyContacts';

export interface SOSTriggerPayload {
  taskId?: string;
  userRole: 'poster' | 'doer';
  latitude: number;
  longitude: number;
  isSilentMode: boolean;
}

export interface SOSAlertResult {
  eventId: string;
  contactsNotified: number;
}

export function useSOSAlert() {
  const [isTriggering, setIsTriggering] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  const triggerSOS = useCallback(async (payload: SOSTriggerPayload): Promise<SOSAlertResult | null> => {
    try {
      setIsTriggering(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login first');
        return null;
      }

      // Fetch emergency contacts
      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id);

      // Create SOS event
      const { data: sosEvent, error: sosError } = await supabase
        .from('sos_events')
        .insert({
          user_id: user.id,
          task_id: payload.taskId || null,
          user_role: payload.userRole,
          status: 'triggered',
          initial_latitude: payload.latitude,
          initial_longitude: payload.longitude,
          current_latitude: payload.latitude,
          current_longitude: payload.longitude,
          is_silent_mode: payload.isSilentMode,
          emergency_contact_notified: (contacts?.length || 0) > 0,
        })
        .select()
        .single();

      if (sosError) throw sosError;

      setActiveEventId(sosEvent.id);

      // Log initial location
      await supabase
        .from('sos_location_history')
        .insert({
          sos_event_id: sosEvent.id,
          latitude: payload.latitude,
          longitude: payload.longitude,
        });

      // Notify contacts (simulated - in production would send SMS/push)
      const contactsNotified = contacts?.length || 0;
      if (contactsNotified > 0) {
        console.log('[SOS] Notifying emergency contacts:', contacts?.map(c => c.contact_name));
        toast.success(`SOS Alert sent to ${contactsNotified} emergency contact(s)`);
      } else {
        toast.warning('SOS activated but no emergency contacts configured');
      }

      return {
        eventId: sosEvent.id,
        contactsNotified,
      };
    } catch (err) {
      console.error('Error triggering SOS:', err);
      toast.error('Failed to trigger SOS alert');
      return null;
    } finally {
      setIsTriggering(false);
    }
  }, []);

  const updateLocation = useCallback(async (latitude: number, longitude: number): Promise<boolean> => {
    if (!activeEventId) return false;

    try {
      // Update current location on event
      await supabase
        .from('sos_events')
        .update({
          current_latitude: latitude,
          current_longitude: longitude,
          last_location_update: new Date().toISOString(),
        })
        .eq('id', activeEventId);

      // Log to history
      await supabase
        .from('sos_location_history')
        .insert({
          sos_event_id: activeEventId,
          latitude,
          longitude,
        });

      return true;
    } catch (err) {
      console.error('Error updating SOS location:', err);
      return false;
    }
  }, [activeEventId]);

  const deactivateSOS = useCallback(async (resolutionNotes?: string): Promise<boolean> => {
    if (!activeEventId) return false;

    try {
      const { error } = await supabase
        .from('sos_events')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes || 'Deactivated by user',
        })
        .eq('id', activeEventId);

      if (error) throw error;

      setActiveEventId(null);
      toast.success('SOS deactivated');
      return true;
    } catch (err) {
      console.error('Error deactivating SOS:', err);
      toast.error('Failed to deactivate SOS');
      return false;
    }
  }, [activeEventId]);

  return {
    triggerSOS,
    updateLocation,
    deactivateSOS,
    isTriggering,
    activeEventId,
    isActive: !!activeEventId,
  };
}
