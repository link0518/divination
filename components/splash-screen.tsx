"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function SplashScreen() {
    const [show, setShow] = useState(true);
    const [fading, setFading] = useState(false);

    useEffect(() => {
        // Prevent scrolling when splash screen is visible
        document.body.style.overflow = "hidden";
        const startTime = Date.now();
        const minDuration = 1000; // Minimum 1 second

        const finishLoading = () => {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minDuration - elapsedTime);

            setTimeout(() => {
                setFading(true);
                setTimeout(() => {
                    setShow(false);
                    document.body.style.overflow = "unset";
                }, 500); // 0.5s fade duration
            }, remainingTime);
        };

        // If page is already loaded, finish immediately (respecting min duration)
        if (document.readyState === "complete") {
            finishLoading();
        } else {
            // Otherwise wait for load event
            window.addEventListener("load", finishLoading);
            // Fallback safety timer (3s) in case load event doesn't fire or takes too long
            const safetyTimer = setTimeout(finishLoading, 3000);

            return () => {
                window.removeEventListener("load", finishLoading);
                clearTimeout(safetyTimer);
                document.body.style.overflow = "unset";
            };
        }
    }, []);

    if (!show) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out",
                "bg-[#fcfaf8] dark:bg-[#1c1917]", // Custom refined colors for "Rice Paper" and "Ink"
                fading ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
        >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.03),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_70%)] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
                {/* Tai Chi Symbol - SVG for crispness and perfect scaling */}
                <div className="relative h-24 w-24 md:h-32 md:w-32 animate-[spin_8s_linear_infinite] drop-shadow-2xl opacity-90">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-[#2c2c2c] dark:text-[#e5e5e5]">
                        <defs>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>
                        {/* Main Circle Outline (Subtle) */}
                        <circle cx="50" cy="50" r="49" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />

                        {/* Yang (Solid) */}
                        <path d="M50 1 A 49 49 0 0 1 50 99 A 24.5 24.5 0 0 1 50 50 A 24.5 24.5 0 0 0 50 1 Z" fill="currentColor" />

                        {/* Yin (Empty/Background) */}
                        <path d="M50 1 A 49 49 0 0 0 50 99 A 24.5 24.5 0 0 0 50 50 A 24.5 24.5 0 0 1 50 1 Z" fill="transparent" />

                        {/* Yang Dot (Hollow/Background color) */}
                        <circle cx="50" cy="25.5" r="6" fill="hsl(var(--background))" className="dark:fill-[#1c1917] fill-[#fcfaf8]" />

                        {/* Yin Dot (Solid) */}
                        <circle cx="50" cy="74.5" r="6" fill="currentColor" />
                    </svg>
                </div>

                {/* Typography */}
                <div className="mt-12 flex flex-col items-center space-y-4">
                    <div className={cn(
                        "text-2xl md:text-3xl font-medium tracking-[0.6em] text-[#2c2c2c] dark:text-[#e5e5e5]",
                        "animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards motion-reduce:animate-none"
                    )}>
                        大道五十
                    </div>
                    <div className={cn(
                        "text-lg md:text-xl font-light tracking-[0.8em] text-[#57534e] dark:text-[#a8a29e]",
                        "animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-forwards motion-reduce:animate-none"
                    )}>
                        天衍四九
                    </div>
                </div>
            </div>
        </div>
    );
}
