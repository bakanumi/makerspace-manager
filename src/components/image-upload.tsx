"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/upload";

export function ImageUpload({
  id,
  name,
  defaultValue,
}: {
  id: string;
  name: string;
  defaultValue?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const res = await uploadImage({}, formData);
      if (res.url) {
        setUrl(res.url);
        toast.success("Foto hochgeladen");
      } else if (res.error) {
        toast.error(res.error);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Input
          id={id}
          name={name}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={pending}
          onClick={() => fileInputRef.current?.click()}
          title="Foto hochladen"
        >
          <Upload className="h-4 w-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-16 w-16 rounded border object-cover" />
      )}
    </div>
  );
}
