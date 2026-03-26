import { toast } from "sonner";

export function handleApiError(
  error: unknown,
  fallbackMessage = "Ocurrió un error inesperado"
): void {
  if (error instanceof Error) {
    if (error.message === "Sesión expirada") {
      toast.error("Tu sesión expiró. Volvé a iniciar sesión.");
      return;
    }
    toast.error(error.message || fallbackMessage);
    return;
  }

  if (typeof error === "string") {
    toast.error(error || fallbackMessage);
    return;
  }

  toast.error(fallbackMessage);
}
