import { lazy, Suspense, useState, useEffect, useRef } from "react";

const Footer = lazy(() => import("@/components/dashboard/Footer"));

interface LazyFooterProps {
  ownerName: string;
}

export const LazyFooter = ({ ownerName }: LazyFooterProps) => {
  const [visible, setVisible] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sentinel}>
      {visible ? (
        <Suspense fallback={null}>
          <Footer ownerName={ownerName} />
        </Suspense>
      ) : (
        <footer className="mt-auto border-t border-border pb-7 pt-5">
          <div className="mx-auto w-[min(100%-1.5rem,72rem)]">
            <p className="text-center font-display text-[0.7rem] font-medium text-muted-foreground sm:text-[0.75rem]">
              &nbsp;
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};
