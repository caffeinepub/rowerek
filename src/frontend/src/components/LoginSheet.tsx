import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Role, backendInterface } from "../backend";

interface LoginSheetProps {
  open: boolean;
  onClose: () => void;
  actor: backendInterface | null;
  onLogin: (username: string, role: Role) => void;
}

const DIGIT_KEYS = ["d0", "d1", "d2", "d3"] as const;

export default function LoginSheet({
  open,
  onClose,
  actor,
  onLogin,
}: LoginSheetProps) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const refs = [ref0, ref1, ref2, ref3];

  useEffect(() => {
    if (open) {
      setDigits(["", "", "", ""]);
      setError("");
      setTimeout(() => ref0.current?.focus(), 100);
    }
  }, [open]);

  const attemptLogin = async (pin: string) => {
    if (!actor || loading) return;
    setLoading(true);
    setError("");
    try {
      const [username, role] = await actor.login(pin);
      onLogin(username, role);
    } catch {
      setError("Nieprawidłowy kod PIN");
      setDigits(["", "", "", ""]);
      setTimeout(() => ref0.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError("");
    if (digit && index < 3) refs[index + 1].current?.focus();
    if (newDigits.every((d) => d !== "")) attemptLogin(newDigits.join(""));
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
      refs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);
    if (pasted.length === 4) {
      setDigits(pasted.split(""));
      ref3.current?.focus();
      attemptLogin(pasted);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-10">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-center text-xl font-display">
            Wpisz kod PIN
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col items-center gap-6">
          <div
            className="flex gap-3"
            data-ocid="login.input"
            onPaste={handlePaste}
          >
            {digits.map((d, i) => (
              <input
                key={DIGIT_KEYS[i]}
                ref={refs[i]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading}
                className="w-14 h-16 text-center text-3xl font-bold rounded-xl border-2 border-input bg-card text-foreground focus:border-primary focus:outline-none transition-colors disabled:opacity-50 caret-transparent"
                aria-label={`Cyfra ${i + 1}`}
              />
            ))}
          </div>
          {error && (
            <p
              className="text-destructive text-sm font-medium animate-fade-in"
              data-ocid="login.error_state"
            >
              {error}
            </p>
          )}
          {loading && (
            <p className="text-muted-foreground text-sm animate-pulse">
              Logowanie...
            </p>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Wpisz swój 4-cyfrowy kod, aby się zalogować
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
