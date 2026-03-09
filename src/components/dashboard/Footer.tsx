import React from "react";

interface FooterProps {
  ownerName: string;
}

export const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ ownerName }, ref) => {
    return (
      <footer ref={ref} className="mt-auto pb-7 pt-5">
        <div className="mx-auto w-[min(100%-1.5rem,72rem)]">
          <p className="text-center font-display text-[0.7rem] font-medium text-muted-foreground sm:text-[0.75rem]">
            © 2026 {ownerName} 2D/3D Live
          </p>
        </div>
      </footer>
    );
  }
);

Footer.displayName = "Footer";
