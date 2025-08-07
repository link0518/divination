import React from "react";
import { VERSION } from "@/lib/constant";
import { Github } from "lucide-react";

function Footer() {
  return (
    <footer className="mx-auto flex items-center gap-3 text-xs text-muted-foreground/80">
      <span className="italic">心诚则灵</span>
      <span>by 咕涌</span>
    </footer>
  );
}

export default Footer;
