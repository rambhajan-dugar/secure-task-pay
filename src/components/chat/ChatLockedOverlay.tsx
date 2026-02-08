import React from 'react';
import { Lock, Phone, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ChatLockedOverlayProps {
  isOpen: boolean;
  reason: 'frozen' | 'dispute' | 'admin_lock';
  disputeStatus?: string;
  onContactSupport: () => void;
  onViewDispute?: () => void;
}

export const ChatLockedOverlay: React.FC<ChatLockedOverlayProps> = ({
  isOpen,
  reason,
  disputeStatus,
  onContactSupport,
  onViewDispute,
}) => {
  const getContent = () => {
    switch (reason) {
      case 'frozen':
        return {
          title: 'Account Restricted',
          description: 'Your account has been temporarily restricted. All messaging is disabled until this is resolved.',
          icon: <AlertCircle className="w-12 h-12 text-destructive" />,
        };
      case 'dispute':
        return {
          title: 'Dispute In Progress',
          description: `This task is under dispute review. Chat is locked while our team investigates.${disputeStatus ? ` Status: ${disputeStatus}` : ''}`,
          icon: <FileText className="w-12 h-12 text-warning" />,
        };
      default:
        return {
          title: 'Chat Locked',
          description: 'This conversation has been locked by an administrator. Please contact support for assistance.',
          icon: <Lock className="w-12 h-12 text-muted-foreground" />,
        };
    }
  };

  const content = getContent();

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="items-center text-center">
          <div className="mb-4">{content.icon}</div>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription className="text-center">
            {content.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 mt-4">
          {reason === 'dispute' && onViewDispute && (
            <Button variant="outline" onClick={onViewDispute}>
              <FileText className="w-4 h-4 mr-2" />
              View Dispute Status
            </Button>
          )}
          <Button variant="default" onClick={onContactSupport}>
            <Phone className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatLockedOverlay;
