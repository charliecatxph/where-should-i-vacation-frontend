import { useEffect, useRef } from "react";

export function useClickOutside<T extends HTMLElement>(callback: () => void) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!ref.current) return; // Ensure ref exists

      const target = event.target as Node;
      const parent = ref.current.parentElement;

      // Ignore clicks inside the ref itself and its parent
      if (ref.current.contains(target) || (parent && parent.contains(target))) {
        return;
      }

      callback(); // Call only when clicking completely outside
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [callback]);

  return ref;
}
