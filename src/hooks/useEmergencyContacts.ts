/**
 * Hook for managing emergency contacts
 * - Fetch, add, delete contacts
 * - Max 3 contacts per user
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmergencyContact {
  id: string;
  user_id: string;
  contact_name: string;
  contact_phone: string;
  relationship: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface AddContactPayload {
  contact_name: string;
  contact_phone: string;
  relationship?: string;
}

export function useEmergencyContacts() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setContacts([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setContacts(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching emergency contacts:', err);
      setError('Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const addContact = async (payload: AddContactPayload): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login first');
        return false;
      }

      // Check limit
      if (contacts.length >= 3) {
        toast.error('Maximum 3 emergency contacts allowed');
        return false;
      }

      // Validate phone
      const phoneRegex = /^[+]?[\d\s-]{10,15}$/;
      if (!phoneRegex.test(payload.contact_phone)) {
        toast.error('Please enter a valid phone number');
        return false;
      }

      const { error: insertError } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: user.id,
          contact_name: payload.contact_name.trim(),
          contact_phone: payload.contact_phone.trim(),
          relationship: payload.relationship?.trim() || null,
          is_primary: contacts.length === 0, // First contact is primary
        });

      if (insertError) throw insertError;

      toast.success('Emergency contact added');
      await fetchContacts();
      return true;
    } catch (err) {
      console.error('Error adding contact:', err);
      toast.error('Failed to add contact');
      return false;
    }
  };

  const deleteContact = async (contactId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', contactId);

      if (deleteError) throw deleteError;

      toast.success('Contact removed');
      await fetchContacts();
      return true;
    } catch (err) {
      console.error('Error deleting contact:', err);
      toast.error('Failed to remove contact');
      return false;
    }
  };

  const setPrimaryContact = async (contactId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Remove primary from all contacts
      await supabase
        .from('emergency_contacts')
        .update({ is_primary: false })
        .eq('user_id', user.id);

      // Set new primary
      const { error: updateError } = await supabase
        .from('emergency_contacts')
        .update({ is_primary: true })
        .eq('id', contactId);

      if (updateError) throw updateError;

      await fetchContacts();
      return true;
    } catch (err) {
      console.error('Error setting primary contact:', err);
      toast.error('Failed to update primary contact');
      return false;
    }
  };

  return {
    contacts,
    loading,
    error,
    addContact,
    deleteContact,
    setPrimaryContact,
    refresh: fetchContacts,
    canAddMore: contacts.length < 3,
  };
}
