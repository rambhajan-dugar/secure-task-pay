import React from 'react';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'grid';
  showLabel?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  showLabel = true,
  className,
}) => {
  const { language, setLanguage, supportedLanguages, t } = useLanguage();

  if (variant === 'grid') {
    return (
      <div className={cn('grid grid-cols-2 gap-3', className)}>
        {supportedLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
              language === lang.code
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            <span className="text-2xl">{lang.flag}</span>
            <div className="text-left">
              <p className="font-medium">{lang.nativeName}</p>
              <p className="text-sm text-muted-foreground">{lang.name}</p>
            </div>
            {language === lang.code && (
              <Check className="w-5 h-5 text-primary ml-auto" />
            )}
          </button>
        ))}
      </div>
    );
  }

  const currentLang = supportedLanguages.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('gap-2', className)}>
          <Globe className="w-4 h-4" />
          {showLabel && (
            <span className="hidden sm:inline">{currentLang?.nativeName}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="flex items-center gap-3"
          >
            <span className="text-lg">{lang.flag}</span>
            <div className="flex-1">
              <p className="font-medium">{lang.nativeName}</p>
              <p className="text-xs text-muted-foreground">{lang.name}</p>
            </div>
            {language === lang.code && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
