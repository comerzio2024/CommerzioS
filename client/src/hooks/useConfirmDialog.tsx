/**
 * Custom hook for styled confirmation dialogs
 * Replaces all window.confirm() calls with beautiful UI dialogs
 */

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Info, HelpCircle, Trash2, CheckCircle2 } from "lucide-react";

type ConfirmVariant = "default" | "destructive" | "warning" | "info" | "success";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      setResolveRef(() => resolve);
      setOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    resolveRef?.(true);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    resolveRef?.(false);
  }, [resolveRef]);

  const getIcon = (variant: ConfirmVariant = "default") => {
    switch (variant) {
      case "destructive":
        return <Trash2 className="w-6 h-6 text-destructive" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case "info":
        return <Info className="w-6 h-6 text-blue-500" />;
      case "success":
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      default:
        return <HelpCircle className="w-6 h-6 text-muted-foreground" />;
    }
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-start gap-4">
              {options && getIcon(options.variant)}
              <div className="flex-1">
                <AlertDialogTitle>{options?.title}</AlertDialogTitle>
                <AlertDialogDescription className="mt-2">
                  {options?.description}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {options?.cancelText || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                options?.variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {options?.confirmText || "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog must be used within a ConfirmDialogProvider");
  }
  return context;
}
