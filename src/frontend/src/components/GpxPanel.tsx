import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Download, FileText, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { UserSession } from "../App";
import type { backendInterface } from "../backend";
import { getUsernameColor } from "../utils/helpers";

interface GpxPanelProps {
  open: boolean;
  onClose: () => void;
  actor: backendInterface | null;
  currentUser: UserSession | null;
}

type GpxFile = [bigint, string, string, bigint]; // [id, username, filename, timestamp]

export default function GpxPanel({
  open,
  onClose,
  actor,
  currentUser,
}: GpxPanelProps) {
  const [files, setFiles] = useState<GpxFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<bigint | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const result = await actor.getGpxFiles();
      setFiles(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Błąd ładowania plików GPX: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (open && actor) {
      fetchFiles();
    }
  }, [open, actor, fetchFiles]);

  const handleDownload = async (file: GpxFile) => {
    if (!actor) return;
    const [id, , filename] = file;
    setDownloadingId(id);
    try {
      const content = await actor.getGpxContent(id);
      const blob = new Blob([content], { type: "application/gpx+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.endsWith(".gpx") ? filename : `${filename}.gpx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Błąd pobierania: ${msg}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("Nie można odczytać pliku"));
        }
      };
      reader.onerror = () => reject(new Error("Błąd odczytu pliku"));
      reader.readAsText(file, "UTF-8");
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !actor || !currentUser) return;

    if (!file.name.toLowerCase().endsWith(".gpx")) {
      toast.error("Tylko pliki .gpx są dozwolone");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const content = await readFileAsText(file);
      if (!content || content.trim().length === 0) {
        toast.error("Plik GPX jest pusty");
        return;
      }
      await actor.addGpxFile(currentUser.username, file.name, content);
      toast.success("Plik GPX dodany", { duration: 1500 });
      await fetchFiles();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Błąd przesyłania: ${msg}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[80vh] overflow-y-auto"
        data-ocid="gpx.sheet"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pliki GPX
          </SheetTitle>
        </SheetHeader>

        <p className="text-xs text-muted-foreground mb-3">
          Maksymalnie 3 pliki. Najstarszy jest automatycznie usuwany po dodaniu
          nowego.
        </p>

        {/* Upload section */}
        {currentUser && (
          <div className="mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".gpx"
              className="hidden"
              onChange={handleUpload}
              data-ocid="gpx.upload_button"
            />
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              data-ocid="gpx.submit_button"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Wysyłanie..." : "Wyślij plik GPX"}
            </Button>
          </div>
        )}

        {/* File list */}
        {loading ? (
          <div
            className="text-center py-6 text-muted-foreground text-sm"
            data-ocid="gpx.loading_state"
          >
            Ładowanie...
          </div>
        ) : files.length === 0 ? (
          <div
            className="text-center py-6 text-muted-foreground text-sm"
            data-ocid="gpx.empty_state"
          >
            Brak plików GPX
          </div>
        ) : (
          <ul className="space-y-2" data-ocid="gpx.list">
            {files.map((file, idx) => {
              const [id, username, filename] = file;
              const color = getUsernameColor(username);
              const ocid = `gpx.item.${idx + 1}`;
              return (
                <li
                  key={String(id)}
                  className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/50 border border-border"
                  data-ocid={ocid}
                >
                  <div className="flex flex-col min-w-0">
                    <span
                      className="text-xs font-semibold truncate"
                      style={{ color }}
                    >
                      {username}
                    </span>
                    <span className="text-sm truncate text-foreground">
                      {filename}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleDownload(file)}
                    disabled={downloadingId === id}
                    aria-label={`Pobierz ${filename}`}
                    data-ocid="gpx.download_button"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
