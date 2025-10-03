import { useEffect, useState, type PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

export default function Portal({ children }: PropsWithChildren<{}>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (typeof window === 'undefined') return null;

  return createPortal(children, document.body);
}
