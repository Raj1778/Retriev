"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { Button } from "@/components/ui/button";

const WORDS = [
  "research papers",
  "legal contracts",
  "textbooks",
  "your notes",
  "financial reports",
];

function RotatingWord() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length);
        setVisible(true);
      }, 350);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className="inline-block transition-all duration-300"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
        background: "linear-gradient(90deg, #7dd3fc, #a78bfa, #f9a8d4)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {WORDS[index]}
    </span>
  );
}

export default function BackgroundGradientAnimationDemo() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setTimeout(() => setMounted(true), 80);
  }, []);

  return (
    <BackgroundGradientAnimation
      gradientBackgroundStart="rgb(4, 4, 18)"
      gradientBackgroundEnd="rgb(10, 4, 32)"
      firstColor="50, 70, 255"
      secondColor="110, 30, 200"
      thirdColor="15, 150, 230"
      fourthColor="170, 25, 110"
      fifthColor="30, 190, 170"
      pointerColor="90, 110, 240"
      blendingValue="screen"
      size="75%"
    >
      {/* ─── NAVBAR ─── */}
      <nav
        className="absolute top-0 left-0 w-full z-50 px-8 py-7 flex items-center justify-between"
        style={{
          transition: "opacity 0.6s ease",
          opacity: mounted ? 1 : 0,
        }}
      >
        {/* Wordmark */}
        <div className="flex items-center gap-2.5">
          {/* Icon mark */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #2563eb)",
              boxShadow: "0 0 16px rgba(124,58,237,0.5)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 3h10M2 7h6M2 11h8"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span
            className="text-xl font-semibold tracking-[-0.02em]"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "rgba(255,255,255,0.95)",
              letterSpacing: "-0.03em",
            }}
          >
            Retriev
          </span>
        </div>

        {/* Auth */}
        <div className="flex items-center gap-2">
          <Link href="/login">
            <button
              className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200"
              style={{
                color: "rgba(255,255,255,0.7)",
                background: "transparent",
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(255,255,255,0.7)")
              }
            >
              Sign in
            </button>
          </Link>

          <Link href="/signup">
            <button className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 bg-white text-black transition cursor-pointer">
              Get started
            </button>
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <div className="relative z-40 flex flex-col justify-center h-screen px-8 md:px-20 lg:px-28">
        <div
          className="max-w-3xl"
          style={{
            transition: "opacity 0.8s ease, transform 0.8s ease",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(20px)",
          }}
        >
          {/* Headline */}
          <h1
            className="text-5xl md:text-6xl lg:text-[4.5rem] font-bold leading-[1.06] tracking-[-0.03em] text-white"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Ask questions about
            <br />
            <RotatingWord />
          </h1>

          {/* Subheading */}
          <p
            className="mt-7 text-lg md:text-xl leading-relaxed max-w-xl"
            style={{
              color: "rgba(255,255,255,0.5)",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
            }}
          >
            Upload any document. Ask anything. Retriev finds precise answers
            grounded in your source — no hallucinations, no page-hunting.
          </p>

          {/* CTAs */}
          <div
            className="mt-10 flex flex-col sm:flex-row gap-3"
            style={{
              transition: "opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s",
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(16px)",
            }}
          >
            <Link href="/signup">
              <button
                className="group px-7 py-3.5 text-base font-semibold rounded-2xl transition-all duration-200 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                  color: "white",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Start for free
                <span className="ml-2 group-hover:translate-x-0.5 inline-block ">
                  →
                </span>
              </button>
            </Link>

            <Link href="/login">
              <button className="bg-white px-7 py-3.5 text-base font-medium rounded-2xl transition-all duration-200 cursor-pointer">
                Sign in to my account
              </button>
            </Link>
          </div>
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
}
