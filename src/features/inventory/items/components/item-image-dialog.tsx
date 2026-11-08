import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

import { useUploadItemImage } from '../../category/hooks/useCategoryMutations';
import type { ItemResponse } from '../types';
import { getImageErrorMessage, validateImageFile } from '../../category/lib/item-image';

interface Props {
  item: ItemResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ItemImageDialog({ item, open, onOpenChange, onSuccess }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open && item && (
          <ImageForm item={item} onClose={() => onOpenChange(false)} onSuccess={onSuccess} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ImageForm({
  item,
  onClose,
  onSuccess,
}: {
  item: ItemResponse;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const upload = useUploadItemImage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Revoke object URLs so previews don't leak memory
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0] ?? null;
    const problem = next ? validateImageFile(next) : null;
    setError(problem);
    setFile(problem ? null : next);
    setPreview(next && !problem ? URL.createObjectURL(next) : null);
  }

  async function handleSave() {
    if (!file) return;
    try {
      await upload.mutateAsync({ id: item.id, file });
      toast.success(`Image updated for "${item.name}"`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(getImageErrorMessage(err));
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{item.image_key ? 'Replace image' : 'Add image'}</DialogTitle>
        <DialogDescription>{item.name}</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        {preview && (
          <img
            src={preview}
            alt="Selected preview"
            className="h-40 w-full rounded-md object-contain"
          />
        )}
        <Input
          ref={inputRef}
          htmlFor="item-image-file"
          label="Image"
          type="file"
          accept="image/*"
          error={!!error}
          errorText={error ?? undefined}
          onChange={handleChange}
        />
      </div>

      <DialogFooter className="flex-row justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={upload.isPending}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} disabled={!file || upload.isPending}>
          {upload.isPending ? (
            <span className="inline-flex items-center gap-2">
              <Spinner className="h-3.5 w-3.5" />
              Uploading...
            </span>
          ) : (
            'Save image'
          )}
        </Button>
      </DialogFooter>
    </>
  );
}
