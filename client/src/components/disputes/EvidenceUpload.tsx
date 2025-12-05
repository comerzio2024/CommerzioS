/**
 * EvidenceUpload Component
 * 
 * Upload and manage evidence for a dispute with drag-and-drop,
 * reordering, and multiple file selection support
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  X, 
  FileImage, 
  FileText, 
  Film,
  AlertCircle,
  CheckCircle,
  Loader2,
  GripVertical,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedEvidence {
  id: string;
  url: string;
  filename: string;
  type: 'image' | 'document' | 'video';
  uploadedAt: string;
}

interface EvidenceUploadProps {
  disputeId: string;
  existingEvidence: UploadedEvidence[];
  maxFiles?: number;
  onUpload: (file: File) => Promise<{ url: string; filename: string }>;
  onRemove: (evidenceId: string) => Promise<void>;
  onReorder?: (evidenceIds: string[]) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const ACCEPTED_TYPES = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'application/pdf': 'document',
  'video/mp4': 'video',
  'video/webm': 'video',
} as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getFileType(mimeType: string): 'image' | 'document' | 'video' {
  return (ACCEPTED_TYPES as any)[mimeType] || 'document';
}

function getFileIcon(type: 'image' | 'document' | 'video') {
  switch (type) {
    case 'image': return FileImage;
    case 'video': return Film;
    default: return FileText;
  }
}

export function EvidenceUpload({
  disputeId,
  existingEvidence,
  maxFiles = 5,
  onUpload,
  onRemove,
  onReorder,
  isLoading,
  className,
}: EvidenceUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [localEvidence, setLocalEvidence] = useState<UploadedEvidence[]>(existingEvidence);

  // Keep local state in sync with props
  if (JSON.stringify(localEvidence) !== JSON.stringify(existingEvidence)) {
    setLocalEvidence(existingEvidence);
  }

  const canUploadMore = existingEvidence.length < maxFiles;

  const validateFiles = (files: File[]): { validFiles: File[]; errors: string[] } => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!Object.keys(ACCEPTED_TYPES).includes(file.type)) {
        errors.push(`${file.name}: Invalid file type`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        continue;
      }
      validFiles.push(file);
    }

    return { validFiles, errors };
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setError(null);
    const { validFiles, errors } = validateFiles(files);

    if (errors.length > 0) {
      setError(errors.join(', '));
    }

    if (validFiles.length === 0) return;

    const remainingSlots = maxFiles - existingEvidence.length;
    if (validFiles.length > remainingSlots) {
      setError(`Can only upload ${remainingSlots} more file(s)`);
      validFiles.splice(remainingSlots);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < validFiles.length; i++) {
        await onUpload(validFiles[i]);
        setUploadProgress(((i + 1) / validFiles.length) * 100);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // Reset input
    await processFiles(files);
  }, [existingEvidence.length, maxFiles, onUpload]);

  const handleRemove = async (evidenceId: string) => {
    setRemovingId(evidenceId);
    try {
      await onRemove(evidenceId);
    } catch (err: any) {
      setError(err.message || 'Failed to remove evidence');
    } finally {
      setRemovingId(null);
    }
  };

  // Drag and drop handlers for file upload
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDraggingOver(false);
      }
      return newCounter;
    });
  };

  const handleDragOverUpload = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    setDragCounter(0);

    if (uploading) return;

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  // Reorder handlers
  const handleReorderDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleReorderDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newEvidence = [...localEvidence];
    const draggedItem = newEvidence[draggedIndex];
    newEvidence.splice(draggedIndex, 1);
    newEvidence.splice(index, 0, draggedItem);
    
    setLocalEvidence(newEvidence);
    setDraggedIndex(index);
  };

  const handleReorderDragEnd = async () => {
    if (draggedIndex !== null && onReorder) {
      const newOrder = localEvidence.map(e => e.id);
      try {
        await onReorder(newOrder);
      } catch (err) {
        // Revert on error
        setLocalEvidence(existingEvidence);
      }
    }
    setDraggedIndex(null);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Evidence
          <Badge variant="outline" className="ml-auto">
            {existingEvidence.length}/{maxFiles}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area with Drag and Drop */}
        {canUploadMore && (
          <div className="space-y-2">
            <Label htmlFor="evidence-upload">Upload Evidence</Label>
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOverUpload}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
                isDraggingOver 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/30',
                (uploading || isLoading) && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Input
                id="evidence-upload"
                type="file"
                accept={Object.keys(ACCEPTED_TYPES).join(',')}
                multiple
                onChange={handleFileChange}
                disabled={uploading || isLoading}
                className="hidden"
              />
              <label 
                htmlFor="evidence-upload" 
                className={cn(
                  'flex flex-col items-center gap-3 cursor-pointer',
                  (uploading || isLoading) && 'pointer-events-none'
                )}
              >
                <div className="relative">
                  <Upload className={cn(
                    'w-12 h-12 transition-colors',
                    isDraggingOver ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  {isDraggingOver && (
                    <ImageIcon className="w-6 h-6 text-primary absolute -right-2 -bottom-1 animate-bounce" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <p className={cn(
                    'text-base font-medium transition-colors',
                    isDraggingOver ? 'text-primary' : 'text-foreground'
                  )}>
                    {uploading 
                      ? `Uploading... ${Math.round(uploadProgress)}%`
                      : isDraggingOver 
                      ? 'Drop files here!' 
                      : 'Drag and drop files here'
                    }
                  </p>
                  {!uploading && !isDraggingOver && (
                    <p className="text-sm text-muted-foreground">
                      or click to browse • Select multiple files
                    </p>
                  )}
                </div>
                
                {!uploading && (
                  <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                    <p>Supports: Images, PDFs, Videos (up to 10MB each)</p>
                    <p className="font-medium text-primary">
                      {maxFiles - existingEvidence.length} {maxFiles - existingEvidence.length === 1 ? 'slot' : 'slots'} remaining
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Evidence Grid - Images displayed as grid, others as list */}
        {localEvidence.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Uploaded Evidence</Label>
              {localEvidence.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  Drag to reorder
                </span>
              )}
            </div>
            
            {/* Image Grid */}
            {localEvidence.filter(e => e.type === 'image').length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                  {localEvidence.filter(e => e.type === 'image').map((evidence, idx) => {
                    const originalIndex = localEvidence.findIndex(e => e.id === evidence.id);
                    const isRemoving = removingId === evidence.id;
                    
                    return (
                      <motion.div
                        key={evidence.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2, layout: { type: "spring", stiffness: 300, damping: 30 } }}
                        draggable={!isLoading && !isRemoving}
                        onDragStart={() => handleReorderDragStart(originalIndex)}
                        onDragOver={(e) => handleReorderDragOver(e, originalIndex)}
                        onDragEnd={handleReorderDragEnd}
                        className={cn(
                          'relative group cursor-move transition-all rounded-lg overflow-hidden border-2 border-border',
                          draggedIndex === originalIndex ? 'opacity-40 scale-95' : ''
                        )}
                      >
                        <img 
                          src={evidence.url} 
                          alt={evidence.filename}
                          className="w-full h-24 object-cover"
                        />
                        
                        {/* Drag handle indicator */}
                        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
                        </div>
                        
                        {/* Action overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <a 
                            href={evidence.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4 text-white" />
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-red-500/80 hover:bg-red-500 text-white"
                            onClick={() => handleRemove(evidence.id)}
                            disabled={isRemoving || isLoading}
                          >
                            {isRemoving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
            
            {/* Documents and Videos List */}
            {localEvidence.filter(e => e.type !== 'image').length > 0 && (
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {localEvidence.filter(e => e.type !== 'image').map((evidence) => {
                    const Icon = getFileIcon(evidence.type);
                    const originalIndex = localEvidence.findIndex(e => e.id === evidence.id);
                    const isRemoving = removingId === evidence.id;

                    return (
                      <motion.div
                        key={evidence.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        draggable={!isLoading && !isRemoving}
                        onDragStart={() => handleReorderDragStart(originalIndex)}
                        onDragOver={(e) => handleReorderDragOver(e, originalIndex)}
                        onDragEnd={handleReorderDragEnd}
                        className={cn(
                          'flex items-center gap-3 p-3 bg-muted rounded-lg cursor-move group',
                          draggedIndex === originalIndex ? 'opacity-40 scale-95' : ''
                        )}
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="w-10 h-10 bg-background rounded flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{evidence.filename}</p>
                          <p className="text-xs text-muted-foreground capitalize">{evidence.type}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <a 
                            href={evidence.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemove(evidence.id)}
                            disabled={isRemoving || isLoading}
                          >
                            {isRemoving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* No Evidence */}
        {existingEvidence.length === 0 && !canUploadMore && (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No evidence uploaded</p>
          </div>
        )}

        {/* Tips */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> Upload screenshots, receipts, chat logs, photos, or any documentation 
            that supports your case. Clear evidence helps the AI make fair decisions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
