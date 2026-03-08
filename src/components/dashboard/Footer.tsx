interface FooterProps {
  ownerName: string;
}

export function Footer({ ownerName }: FooterProps) {
  return (
    <footer className="mt-auto border-t border-border pb-7 pt-5">
      <div className="mx-auto w-[min(100%-2rem,72rem)]">
        <p className="text-center font-display text-[0.75rem] font-medium text-muted-foreground">
          // © 2026 {ownerName} 2D/3D Live
        </p>
      </div>
    </footer>
  );
}
