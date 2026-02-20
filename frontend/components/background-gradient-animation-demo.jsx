import React from "react";
import Link from "next/link";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { Button } from "@/components/ui/button";

export default function BackgroundGradientAnimationDemo() {
  return (
    <BackgroundGradientAnimation>
      {/* NAVBAR */}
      <div className="absolute top-0 left-0 w-full z-50 px-6 py-6 flex items-center justify-between">
        {/* Logo */}
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Retriev
          </span>
        </h1>

        {/* Auth buttons */}
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              Login
            </Button>
          </Link>

          <Link href="/signup">
            <Button className="rounded-xl px-5 shadow-lg">Sign Up</Button>
          </Link>
        </div>
      </div>

      {/* HERO CONTENT */}
      <div className="relative z-40 flex items-center h-screen px-6 md:px-20">
        <div className="max-w-2xl mt-16">
          {/* Main Heading */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight">
            Chat with your{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-300">
              documents
            </span>{" "}
            like they understand you.
          </h2>

          {/* Description */}
          <p className="mt-8 text-lg md:text-xl text-white/75 leading-relaxed">
            Retriev turns static PDFs into an intelligent knowledge assistant.
            Upload research papers, notes, contracts, or textbooks and ask
            natural questions — get precise answers grounded in your own data.
            No hallucinations. No searching page by page. Just instant,
            context-aware understanding powered by modern retrieval AI.
          </p>

          <p className="mt-4 text-white/60 text-base md:text-lg">
            Built for students, developers, and professionals who want faster
            learning, better decisions, and zero time wasted scrolling.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/signup">
              <Button className="px-8 py-6 text-lg rounded-2xl shadow-xl">
                Start asking your files
              </Button>
            </Link>

            <Link href="/login">
              <Button
                variant="outline"
                className="px-8 py-6 text-lg rounded-2xl border-white text-white hover:bg-white hover:text-black transition-all"
              >
                I already have an account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
}
  