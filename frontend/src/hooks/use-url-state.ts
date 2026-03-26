"use client";
import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function useURLState<T extends string | number | boolean>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();

  const raw = searchParams.get(key);
  const value = (
    raw !== null
      ? typeof defaultValue === "number"
        ? (Number(raw) as T)
        : typeof defaultValue === "boolean"
        ? ((raw === "1") as T)
        : (raw as T)
      : defaultValue
  ) as T;

  const setValue = useCallback(
    (next: T) => {
      const params = new URLSearchParams(searchParams.toString());

      let serialized: string;
      if (typeof next === "boolean") {
        serialized = next ? "1" : "0";
      } else {
        serialized = String(next);
      }

      const shouldRemove =
        next === defaultValue ||
        (typeof defaultValue === "boolean" && next === false);

      if (shouldRemove) {
        params.delete(key);
      } else {
        params.set(key, serialized);
      }

      const qs = params.toString();
      router.push(qs ? `?${qs}` : "?", { scroll: false });
    },
    [key, defaultValue, router, searchParams]
  );

  return [value, setValue];
}
