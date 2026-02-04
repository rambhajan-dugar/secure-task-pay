import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AlertTriangle, Phone, MapPin, Mic, Shield, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { useSOSAlert } from '@/hooks/useSOSAlert';
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts';

interface SOSButtonProps {
  taskId?: string;
  userRole: 'poster' | 'doer';
  onSOSTriggered?: (sosData: SOSData) => void;
  className?: string;
}

export interface SOSData {
  taskId?: string;
  userRole: 'poster' | 'doer';
  latitude: number;
  longitude: number;
  isSilentMode: boolean;
  timestamp: Date;
  eventId?: string;
  contactsNotified?: number;
}

export const SOSButton: React.FC<SOSButtonProps> = ({
  taskId,
  userRole,
  onSOSTriggered,
  className,
}) => {
  const { t } = useTranslation();
  const sosAlert = useSOSAlert();
  const { contacts } = useEmergencyContacts();
  
  const [isActivated, setIsActivated] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwipeComplete, setIsSwipeComplete] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [isSilentMode, setIsSilentMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [locationSharing, setLocationSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [notifiedCount, setNotifiedCount] = useState(0);
  
  const swipeRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current location
  const fetchLocation = useCallback(async () => {
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setCurrentLocation(newLocation);
            // Update in database if SOS is active
            if (sosAlert.isActive) {
              sosAlert.updateLocation(newLocation.lat, newLocation.lng);
            }
          },
          () => {
            // Fallback to simulated location (Mumbai area)
            setCurrentLocation({
              lat: 19.076 + (Math.random() - 0.5) * 0.01,
              lng: 72.877 + (Math.random() - 0.5) * 0.01,
            });
          }
        );
      }
    } catch {
      // Simulated location
      setCurrentLocation({
        lat: 19.076 + (Math.random() - 0.5) * 0.01,
        lng: 72.877 + (Math.random() - 0.5) * 0.01,
      });
    }
  }, [sosAlert]);

  // Location tracking every 4 seconds when active
  useEffect(() => {
    if (isActivated && locationSharing) {
      fetchLocation();
      
      locationIntervalRef.current = setInterval(() => {
        fetchLocation();
      }, 4000);
    }
    
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [isActivated, locationSharing, fetchLocation]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeRef.current) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    const maxSwipe = swipeRef.current.offsetWidth - 60;
    const progress = Math.min(Math.max(diff / maxSwipe, 0), 1);
    
    setSwipeProgress(progress);
    
    if (progress >= 0.95 && !isSwipeComplete) {
      setIsSwipeComplete(true);
      handleTriggerSOS();
    }
  };

  const handleTouchEnd = () => {
    if (!isSwipeComplete) {
      setSwipeProgress(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!swipeRef.current) return;
      
      const currentX = e.clientX;
      const diff = currentX - startXRef.current;
      const maxSwipe = swipeRef.current.offsetWidth - 60;
      const progress = Math.min(Math.max(diff / maxSwipe, 0), 1);
      
      setSwipeProgress(progress);
      
      if (progress >= 0.95 && !isSwipeComplete) {
        setIsSwipeComplete(true);
        handleTriggerSOS();
      }
    };
    
    const handleMouseUp = () => {
      if (!isSwipeComplete) {
        setSwipeProgress(0);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTriggerSOS = async () => {
    setIsActivated(true);
    setShowPanel(true);
    setLocationSharing(true);
    
    // Haptic feedback if available (Capacitor)
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      // Haptics not available
    }
    
    // Get initial location first
    await fetchLocation();
    
    // Use a default location if geolocation fails
    const location = currentLocation || { lat: 19.076, lng: 72.877 };
    
    // Trigger SOS in database and notify contacts
    const result = await sosAlert.triggerSOS({
      taskId,
      userRole,
      latitude: location.lat,
      longitude: location.lng,
      isSilentMode,
    });
    
    if (result) {
      setNotifiedCount(result.contactsNotified);
      
      // Notify parent component
      if (onSOSTriggered) {
        onSOSTriggered({
          taskId,
          userRole,
          latitude: location.lat,
          longitude: location.lng,
          isSilentMode,
          timestamp: new Date(),
          eventId: result.eventId,
          contactsNotified: result.contactsNotified,
        });
      }
    }
  };

  const handleDeactivateSOS = async () => {
    await sosAlert.deactivateSOS();
    setIsActivated(false);
    setShowPanel(false);
    setSwipeProgress(0);
    setIsSwipeComplete(false);
    setLocationSharing(false);
    setIsRecording(false);
    setIsSilentMode(false);
    setNotifiedCount(0);
    
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
    }
  };

  const toggleSilentMode = () => {
    setIsSilentMode(!isSilentMode);
    if (!isSilentMode) {
      setIsRecording(true);
    } else {
      setIsRecording(false);
    }
  };

  const simulateEmergencyCall = (service: '112' | '102') => {
    // SIMULATED - No actual call made
    alert(`[SIMULATED] This would call ${service} in a real app.\n\nFor demonstration purposes only.`);
  };

  if (!isActivated) {
    return (
      <div className={cn('w-full', className)}>
        {/* Emergency contacts indicator */}
        {contacts.length > 0 && (
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{contacts.length} emergency contact{contacts.length > 1 ? 's' : ''} configured</span>
          </div>
        )}
        
        {/* Swipe to SOS Button */}
        <div
          ref={swipeRef}
          className="relative h-16 bg-destructive/20 rounded-full overflow-hidden border-2 border-destructive cursor-pointer"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          {/* Progress fill */}
          <div
            className="absolute inset-0 bg-destructive transition-all duration-100"
            style={{ width: `${swipeProgress * 100}%` }}
          />
          
          {/* Swipe handle */}
          <div
            className="absolute top-1 left-1 w-14 h-14 bg-background rounded-full flex items-center justify-center shadow-lg transition-transform"
            style={{ transform: `translateX(${swipeProgress * (swipeRef.current?.offsetWidth || 200 - 60)}px)` }}
          >
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          
          {/* Text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className={cn(
              'font-semibold transition-opacity',
              swipeProgress > 0.3 ? 'text-destructive-foreground' : 'text-destructive'
            )}>
              {t('swipeToActivate')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SOS Active Panel */}
      <div className={cn(
        'fixed inset-0 z-50 bg-destructive/95 text-destructive-foreground p-4 flex flex-col',
        showPanel ? 'animate-in fade-in slide-in-from-bottom duration-300' : 'hidden'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-background/20 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t('sosActivated')}</h2>
              <p className="text-destructive-foreground/80 text-sm">
                {notifiedCount > 0 
                  ? `${notifiedCount} contact${notifiedCount > 1 ? 's' : ''} notified`
                  : t('safetyTeamNotified')
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive-foreground hover:bg-background/20"
            onClick={handleDeactivateSOS}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Status Indicators */}
        <div className="space-y-4 mb-6">
          {locationSharing && (
            <div className="flex items-center gap-3 bg-background/10 rounded-lg p-4">
              <MapPin className="w-5 h-5 animate-pulse" />
              <div className="flex-1">
                <p className="font-medium">{t('locationSharing')}</p>
                {currentLocation && (
                  <p className="text-sm text-destructive-foreground/70">
                    {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </p>
                )}
              </div>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
          )}

          {isRecording && (
            <div className="flex items-center gap-3 bg-background/10 rounded-lg p-4">
              <Mic className="w-5 h-5 animate-pulse" />
              <div className="flex-1">
                <p className="font-medium">{t('recordingActive')}</p>
                <p className="text-sm text-destructive-foreground/70">[SIMULATED - Demo Only]</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-destructive-foreground animate-pulse" />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 flex-1">
          {/* Silent SOS Toggle */}
          <Button
            variant={isSilentMode ? 'default' : 'outline'}
            className={cn(
              'w-full h-14 text-lg justify-start gap-4',
              isSilentMode ? 'bg-background text-destructive' : 'border-destructive-foreground/50 text-destructive-foreground hover:bg-background/10'
            )}
            onClick={toggleSilentMode}
          >
            <Mic className="w-6 h-6" />
            <span>{t('silentSOS')}</span>
            {isSilentMode && <span className="ml-auto text-sm">[ACTIVE]</span>}
          </Button>

          {/* Emergency Calls - SIMULATED */}
          <Button
            variant="outline"
            className="w-full h-14 text-lg justify-start gap-4 border-destructive-foreground/50 text-destructive-foreground hover:bg-background/10"
            onClick={() => simulateEmergencyCall('112')}
          >
            <Phone className="w-6 h-6" />
            <span>{t('callPolice')}</span>
            <span className="ml-auto text-xs opacity-70">[SIMULATED]</span>
          </Button>

          <Button
            variant="outline"
            className="w-full h-14 text-lg justify-start gap-4 border-destructive-foreground/50 text-destructive-foreground hover:bg-background/10"
            onClick={() => simulateEmergencyCall('102')}
          >
            <Phone className="w-6 h-6" />
            <span>{t('callMedical')}</span>
            <span className="ml-auto text-xs opacity-70">[SIMULATED]</span>
          </Button>

          {/* Share Location */}
          <Button
            variant="outline"
            className="w-full h-14 text-lg justify-start gap-4 border-destructive-foreground/50 text-destructive-foreground hover:bg-background/10"
            onClick={() => setLocationSharing(true)}
          >
            <MapPin className="w-6 h-6" />
            <span>{t('shareLocation')}</span>
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 p-4 bg-background/10 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive-foreground/80">
              {t('sosDisclaimer')}
            </p>
          </div>
        </div>

        {/* Deactivate Button */}
        <Button
          variant="secondary"
          className="w-full mt-4 h-14 text-lg bg-background text-destructive hover:bg-background/90"
          onClick={handleDeactivateSOS}
        >
          {t('sosDeactivated')} - {t('cancel')}
        </Button>
      </div>
    </>
  );
};

export default SOSButton;
