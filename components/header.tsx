import React from "react";
import { ModeToggle } from "@/components/mode-toggle";

export default function Header() {
  return (
    <header className="h-14 bg-secondary py-2 shadow">
      <div className="mx-auto flex h-full w-full items-center justify-center sm:max-w-md sm:justify-between md:max-w-2xl">
        <div className="flex gap-2 items-center">
          <span className="text-2xl">🦊</span>
          <span>毛毛狐卜卦助手</span>
        </div>
        <ModeToggle />
      </div>
    </header>
  );
}
