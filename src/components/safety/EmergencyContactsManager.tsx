import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Star, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmergencyContact {
  id: string;
  contact_name: string;
  contact_phone: string;
  relationship: string | null;
  is_primary: boolean;
}

export const EmergencyContactsManager: React.FC = () => {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({
    contact_name: '',
    contact_phone: '',
    relationship: '',
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login first');
        return;
      }

      const { error } = await supabase
        .from('emergency_contacts')
        .insert({
          user_id: user.id,
          contact_name: newContact.contact_name,
          contact_phone: newContact.contact_phone,
          relationship: newContact.relationship || null,
          is_primary: contacts.length === 0,
        });

      if (error) throw error;

      toast.success(t('success'));
      setNewContact({ contact_name: '', contact_phone: '', relationship: '' });
      setShowAddForm(false);
      fetchContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error(t('error'));
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('emergency_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success(t('success'));
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error(t('error'));
    }
  };

  const setPrimaryContact = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Remove primary from all
      await supabase
        .from('emergency_contacts')
        .update({ is_primary: false })
        .eq('user_id', user.id);

      // Set new primary
      await supabase
        .from('emergency_contacts')
        .update({ is_primary: true })
        .eq('id', id);

      fetchContacts();
    } catch (error) {
      console.error('Error setting primary:', error);
      toast.error(t('error'));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          {t('emergencyContacts')}
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('addEmergencyContact')}
        </Button>
      </CardHeader>
      <CardContent>
        {/* Add Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-3">
            <Input
              placeholder={t('fullName')}
              value={newContact.contact_name}
              onChange={(e) => setNewContact({ ...newContact, contact_name: e.target.value })}
            />
            <Input
              placeholder={t('phone')}
              type="tel"
              value={newContact.contact_phone}
              onChange={(e) => setNewContact({ ...newContact, contact_phone: e.target.value })}
            />
            <Input
              placeholder="Relationship (optional)"
              value={newContact.relationship}
              onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={addContact} disabled={!newContact.contact_name || !newContact.contact_phone}>
                {t('save')}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        )}

        {/* Contacts List */}
        {contacts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t('noResults')}
          </p>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-4 p-4 bg-card border rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{contact.contact_name}</span>
                    {contact.is_primary && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{contact.contact_phone}</p>
                  {contact.relationship && (
                    <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!contact.is_primary && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setPrimaryContact(contact.id)}
                      title="Set as primary"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteContact(contact.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmergencyContactsManager;
