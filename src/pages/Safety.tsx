import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n/LanguageContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { EmergencyContactsManager } from '@/components/safety/EmergencyContactsManager';
import { SOSButton } from '@/components/safety/SOSButton';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, Users } from 'lucide-react';

const Safety: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentRole } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              {t('safetyCenter')}
            </h1>
            <p className="text-muted-foreground">{t('sosDisclaimer')}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* SOS Section */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                {t('sosButton')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                In case of emergency during a task, use the SOS button to alert your emergency contacts and share your location.
              </p>
              <SOSButton 
                userRole={currentRole === 'task_poster' ? 'poster' : 'doer'} 
              />
            </CardContent>
          </Card>

          {/* Info Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                How SOS Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">1. Swipe to Activate</h4>
                <p className="text-sm text-muted-foreground">
                  Swipe the SOS button to trigger an emergency alert.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">2. Contacts Notified</h4>
                <p className="text-sm text-muted-foreground">
                  Your emergency contacts receive an instant alert with your name, role, and location.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">3. Location Tracking</h4>
                <p className="text-sm text-muted-foreground">
                  Your live location is shared every 4 seconds until you deactivate SOS.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">4. Silent Mode</h4>
                <p className="text-sm text-muted-foreground">
                  Enable silent mode to discreetly alert contacts without visible notifications.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Contacts */}
        <div className="mt-8">
          <EmergencyContactsManager />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Safety;
