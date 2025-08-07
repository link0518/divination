"use client";
import React from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="h-14 bg-secondary py-2 shadow">
      <div className="mx-auto flex h-full w-full items-center justify-center sm:max-w-md sm:justify-between md:max-w-2xl">
        <div className="flex gap-2 items-center">
          <span className="text-2xl">🦊</span>
          <span>毛毛狐卜卦助手</span>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.reload()}
            title="回到主页"
          >
            <Home className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </div>
      </div>
    </header>
  );
}
