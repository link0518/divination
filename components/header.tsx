import React from "react";
import { ModeToggle } from "@/components/mode-toggle";
import Image from "next/image";

export default function Header() {
  return (
    <header className="h-14 bg-secondary py-2 shadow">
      <div className="mx-auto flex h-full w-full items-center justify-center sm:max-w-md sm:justify-between md:max-w-2xl">
        <div className="flex gap-2 items-center">
          <Image
            src="/fox.svg"
            alt="狐狸图标"
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <span>毛毛狐算卦助手</span>
        </div>
        <ModeToggle />
      </div>
    </header>
  );
}
