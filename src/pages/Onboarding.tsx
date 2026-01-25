import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useTranslation } from '@/i18n/LanguageContext';

const Onboarding: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const handleContinue = () => {
    if (step === 0) {
      setStep(1);
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">{t('appName')}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {step === 0 ? (
          <>
            <h1 className="text-3xl font-bold text-center mb-4">
              {t('chooseLanguage')}
            </h1>
            <p className="text-muted-foreground text-center mb-8">
              {t('selectLanguage')}
            </p>
            <LanguageSelector variant="grid" className="max-w-md w-full mb-8" />
          </>
        ) : (
          <>
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8">
              <Shield className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-4">
              {t('welcomeTitle')}
            </h1>
            <p className="text-muted-foreground text-center mb-8 max-w-md">
              {t('welcomeSubtitle')}
            </p>
            <p className="text-lg font-medium text-center mb-2">
              {t('tagline')}
            </p>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-6">
        <Button 
          className="w-full h-14 text-lg" 
          onClick={handleContinue}
        >
          {step === 0 ? t('continueBtn') : t('getStarted')}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
