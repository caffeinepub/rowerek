import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Trash2, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { backendInterface } from "../backend";

const PASTEL_PALETTE = [
  "#6eaed1",
  "#6dbf8e",
  "#a07bc0",
  "#d47a8a",
  "#c9a05c",
  "#5aa3b8",
  "#7ab87a",
  "#b07ab0",
];

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  actor: backendInterface | null;
}

export default function AdminPanel({ open, onClose, actor }: AdminPanelProps) {
  const [users, setUsers] = useState<[string, string, string][]>([]);
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [selectedColor, setSelectedColor] = useState(PASTEL_PALETTE[0]);
  const [adding, setAdding] = useState(false);
  const [removingName, setRemovingName] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!actor) return;
    try {
      const list = await actor.getUsers();
      setUsers(list);
    } catch {
      toast.error("Błąd ładowania użytkowników");
    }
  }, [actor]);

  useEffect(() => {
    if (open) loadUsers();
  }, [open, loadUsers]);

  const handleAdd = async () => {
    if (!actor) return;
    if (!newName.trim()) {
      toast.error("Podaj nazwę użytkownika");
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error("PIN musi mieć dokładnie 4 cyfry");
      return;
    }
    setAdding(true);
    try {
      await actor.addUser(newName.trim(), newPin, selectedColor);
      toast.success(`Dodano użytkownika ${newName.trim()}`);
      setNewName("");
      setNewPin("");
      setSelectedColor(PASTEL_PALETTE[0]);
      await loadUsers();
    } catch {
      toast.error("Błąd dodawania użytkownika");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (name: string) => {
    if (!actor) return;
    setRemovingName(name);
    try {
      await actor.removeUser(name);
      toast.success(`Usunięto użytkownika ${name}`);
      await loadUsers();
    } catch {
      toast.error("Błąd usuwania użytkownika");
    } finally {
      setRemovingName(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl pb-10 max-h-[85vh] overflow-y-auto"
        data-ocid="admin.panel"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="font-display text-lg">
            ⚙️ Panel administratora
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-3 mb-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Dodaj użytkownika
          </h3>
          <Input
            placeholder="Nazwa użytkownika"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-11 text-foreground"
            data-ocid="admin.input"
          />
          <Input
            placeholder="Kod PIN (4 cyfry)"
            value={newPin}
            onChange={(e) =>
              setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            inputMode="numeric"
            maxLength={4}
            className="h-11 tracking-widest text-center text-xl font-bold text-foreground"
          />

          {/* Color picker */}
          <div className="flex flex-col gap-1.5">
            <div className="text-sm font-medium text-muted-foreground">
              Kolor użytkownika
            </div>
            <div className="flex gap-2 flex-wrap">
              {PASTEL_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className="w-8 h-8 rounded-full transition-all"
                  style={{
                    backgroundColor: c,
                    outline: selectedColor === c ? "2px solid white" : "none",
                    outlineOffset: "2px",
                  }}
                  aria-label={`Kolor ${c}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium" style={{ color: selectedColor }}>
                Podgląd: {newName || "użytkownik"}
              </span>
            </div>
          </div>

          <Button
            onClick={handleAdd}
            disabled={adding}
            className="w-full gap-2"
            data-ocid="admin.add_user_button"
          >
            <UserPlus className="h-4 w-4" />
            {adding ? "Dodaję..." : "Dodaj użytkownika"}
          </Button>
        </div>

        <Separator className="mb-4" />

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Użytkownicy ({users.length})
          </h3>
          {users.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              Brak użytkowników
            </p>
          )}
          {users.map(([name, pin, color], i) => (
            <div
              key={name}
              className="flex items-center justify-between bg-muted rounded-lg px-3 py-2.5"
              data-ocid={`admin.user.item.${i + 1}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: color || PASTEL_PALETTE[0] }}
                />
                <span
                  className="font-medium text-sm"
                  style={{ color: color || "#6eaed1" }}
                >
                  {name}
                </span>
                <span className="text-sm text-foreground font-bold ml-1 font-mono tracking-widest">
                  {pin}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleRemove(name)}
                disabled={removingName === name}
                data-ocid={`admin.remove_user_button.${i + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
