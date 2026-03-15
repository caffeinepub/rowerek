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

interface AdminPanelProps {
  open: boolean;
  onClose: () => void;
  actor: backendInterface | null;
}

export default function AdminPanel({ open, onClose, actor }: AdminPanelProps) {
  const [users, setUsers] = useState<[string, string][]>([]);
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
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
      await actor.addUser(newName.trim(), newPin);
      toast.success(`Dodano użytkownika ${newName.trim()}`);
      setNewName("");
      setNewPin("");
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
          {users.map(([name, pin], i) => (
            <div
              key={name}
              className="flex items-center justify-between bg-muted rounded-lg px-3 py-2.5"
            >
              <div>
                <span className="font-medium text-sm text-foreground">
                  {name}
                </span>
                <span className="text-sm text-foreground font-bold ml-2 font-mono tracking-widest">
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
