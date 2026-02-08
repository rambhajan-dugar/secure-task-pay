import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageQueueItem {
  id: string;
  taskId: string;
  taskTitle: string;
  phase: 'before' | 'after';
  imageUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  isDisputed: boolean;
  previousRejection?: string;
}

interface ImageReviewQueueProps {
  images: ImageQueueItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewTask: (taskId: string) => void;
  onPreview: (imageUrl: string) => void;
}

export const ImageReviewQueue: React.FC<ImageReviewQueueProps> = ({
  images,
  onApprove,
  onReject,
  onViewTask,
  onPreview,
}) => {
  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No images to review</p>
      </div>
    );
  }

  // Sort: disputed first, then by upload date
  const sortedImages = [...images].sort((a, b) => {
    if (a.isDisputed && !b.isDisputed) return -1;
    if (b.isDisputed && !a.isDisputed) return 1;
    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
  });

  return (
    <ScrollArea className="h-[500px]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedImages.map((image) => (
          <Card 
            key={image.id}
            className={cn(
              'overflow-hidden',
              image.isDisputed && 'border-warning/50 bg-warning/5'
            )}
          >
            {/* Image */}
            <div 
              className="relative cursor-pointer"
              onClick={() => onPreview(image.imageUrl)}
            >
              <AspectRatio ratio={4/3}>
                <img
                  src={image.imageUrl}
                  alt={`${image.phase} verification`}
                  className="w-full h-full object-cover"
                />
              </AspectRatio>
              {/* Overlay badges */}
              <div className="absolute top-2 left-2 flex gap-2">
                <Badge variant="secondary" className="capitalize">
                  {image.phase}
                </Badge>
                {image.isDisputed && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <Scale className="w-3 h-3" />
                    Disputed
                  </Badge>
                )}
              </div>
              <div className="absolute top-2 right-2">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(image.imageUrl);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Info */}
            <CardContent className="p-3">
              <p 
                className="text-sm font-medium truncate cursor-pointer hover:underline"
                onClick={() => onViewTask(image.taskId)}
              >
                {image.taskTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                By {image.uploadedBy} • {format(image.uploadedAt, 'MMM dd')}
              </p>
              
              {image.previousRejection && (
                <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Previously rejected: {image.previousRejection}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="success" 
                  className="flex-1"
                  onClick={() => onApprove(image.id)}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="flex-1"
                  onClick={() => onReject(image.id)}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ImageReviewQueue;
