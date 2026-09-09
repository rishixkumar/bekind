"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { GtMark } from "@/components/gt-mark";
import { enterRoomAction } from "@/lib/actions/hello";
import { SITE_NAME } from "@/lib/constants";
import "@/app/hello/hello.css";

function Title({
  children,
  id,
}: {
  children: string;
  id: string;
}) {
  const lines = children.split("\n");
  return (
    <h2 id={id} className="hello-title" data-reveal>
      {lines.map((line, index) => (
        <span key={line} className="hello-title-line">
          {line}
          {index < lines.length - 1 ? <br /> : null}
        </span>
      ))}
    </h2>
  );
}

function SkipButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="hello-skip" disabled={pending}>
      Skip
    </button>
  );
}

function EnterButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="hello-cta" disabled={pending}>
      {pending ? "Entering…" : "Enter the room"}
    </button>
  );
}

export function HelloExperience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLButtonElement>(null);
  const [reduced, setReduced] = useState(false);
  const [phase, setPhase] = useState<"play" | "exit">("play");

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const nodes = root.querySelectorAll<HTMLElement>("[data-reveal]");
    if (reduced) {
      nodes.forEach((el) => {
        el.dataset.in = "";
      });
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.in = "";
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -10% 0px" },
    );
    nodes.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [reduced]);

  useEffect(() => {
    const cue = cueRef.current;
    if (!cue) return;
    const onScroll = () => {
      const fade = Math.min(1, window.scrollY / (window.innerHeight * 0.28));
      cue.style.opacity = String(1 - fade);
      cue.style.visibility = fade >= 0.98 ? "hidden" : "visible";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toCampus = useCallback(() => {
    document.getElementById("hello-campus")?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }, [reduced]);

  return (
    <div
      ref={rootRef}
      className="hello"
      data-hello-experience=""
      data-phase={phase}
      data-motion={reduced ? "reduce" : "ok"}
      aria-label={`${SITE_NAME} welcome`}
    >
      <div className="hello-atmosphere" aria-hidden />

      <header className="hello-top">
        <div className="hello-brand">
          <GtMark className="h-8 w-auto" />
          <span className="hello-brand-rule" aria-hidden />
          <span className="hello-brand-name">{SITE_NAME}</span>
        </div>
        <form action={enterRoomAction}>
          <SkipButton />
        </form>
      </header>

      <section className="hello-hero" aria-labelledby="hello-welcome-title">
        <div className="hello-copy hello-hero-copy">
          <p className="hello-kicker" data-hero>
            Hello
          </p>
          <h1 id="hello-welcome-title" className="hello-title" data-hero>
            Welcome to BK
          </h1>
          <p className="hello-body" data-hero>
            Not a program. Not a pitch. A room for Tech students who need to say
            the thing out loud.
          </p>
        </div>
        <button
          ref={cueRef}
          type="button"
          className="hello-cue"
          aria-label="Continue"
          onClick={toCampus}
        >
          <span className="hello-cue-mark" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M6.5 9.5 12 15l5.5-5.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </section>

      <section
        id="hello-campus"
        className="hello-block hello-pin"
        aria-labelledby="hello-campus-title"
      >
        <div className="hello-copy">
          <p className="hello-kicker" data-reveal>
            Campus
          </p>
          <Title id="hello-campus-title">{"Packed halls.\nQuiet anyway."}</Title>
          <p className="hello-body" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
            A 200-person lecture. The hill at noon. Still nobody in it with you.
            That’s a Tuesday.
          </p>
        </div>
      </section>

      <section className="hello-block" aria-labelledby="hello-room-title">
        <div className="hello-copy">
          <p className="hello-kicker" data-reveal>
            The room
          </p>
          <h2 id="hello-room-title" className="hello-title" data-reveal>
            Talk without the side-eye.
          </h2>
          <p className="hello-body" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
            Put words down without performing. Read. Reply. Or lurk. Nobody here
            needs you to be impressive.
          </p>
        </div>
      </section>

      <section className="hello-block" aria-labelledby="hello-how-title">
        <div className="hello-copy">
          <p className="hello-kicker" data-reveal>
            How it works
          </p>
          <Title id="hello-how-title">{"Public feed.\nOptional name."}</Title>
          <ul className="hello-points">
            <li data-reveal style={{ "--d": "40ms" } as React.CSSProperties}>
              Anyone can read the room
            </li>
            <li data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
              Reply lives in threads
            </li>
            <li data-reveal style={{ "--d": "200ms" } as React.CSSProperties}>
              Stay anonymous if you want
            </li>
            <li data-reveal style={{ "--d": "280ms" } as React.CSSProperties}>
              Sign in when you’re ready to post
            </li>
          </ul>
        </div>
      </section>

      <section className="hello-block hello-end" aria-labelledby="hello-enter-title">
        <div className="hello-copy">
          <p className="hello-kicker" data-reveal>
            The door
          </p>
          <h2 id="hello-enter-title" className="hello-title" data-reveal>
            Come in.
          </h2>
          <p className="hello-body" data-reveal style={{ "--d": "100ms" } as React.CSSProperties}>
            When you’re ready.
          </p>
          <form
            className="hello-enter"
            action={enterRoomAction}
            onSubmit={() => setPhase("exit")}
            data-reveal
            style={{ "--d": "180ms" } as React.CSSProperties}
          >
            <EnterButton />
          </form>
        </div>
      </section>
    </div>
  );
}
