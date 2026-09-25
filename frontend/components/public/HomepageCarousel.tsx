"use client";

import { useRef, useState, type PointerEvent } from "react";

const slides = [
  {
    eyebrow: "Search with context",
    title: "Start with the role, then add the details that matter.",
    description: "Use job titles, skills, keywords, and Philippine locations together to make your search more useful from the first query.",
    accent: "bg-indigo-600",
  },
  {
    eyebrow: "Read between the lines",
    title: "Know what a role is asking for before you apply.",
    description: "Break down requirements and separate the must-haves from the nice-to-haves so your preparation has direction.",
    accent: "bg-emerald-500",
  },
  {
    eyebrow: "Make the next move",
    title: "Turn a promising listing into a focused application.",
    description: "Keep your search and preparation connected, then continue to the employer or job platform when you are ready.",
    accent: "bg-amber-500",
  },
];

export function HomepageCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const pointerStart = useRef<number | null>(null);

  function showSlide(index: number) {
    setActiveIndex((index + slides.length) % slides.length);
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    pointerStart.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (pointerStart.current === null) {
      return;
    }
    const distance = event.clientX - pointerStart.current;
    if (Math.abs(distance) > 45) {
      showSlide(activeIndex + (distance < 0 ? 1 : -1));
    }
    pointerStart.current = null;
  }

  return (
    <section className="border-b border-slate-200 bg-[#f7f9fc]" aria-labelledby="career-notes-heading">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-indigo-600">A little momentum</p>
            <h2 id="career-notes-heading" className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Make space for your next move.</h2>
          </div>
          <div className="flex items-center gap-2" aria-label="Carousel controls">
            <button type="button" onClick={() => showSlide(activeIndex - 1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-lg text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200" aria-label="Previous career note">←</button>
            <button type="button" onClick={() => showSlide(activeIndex + 1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-lg text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200" aria-label="Next career note">→</button>
          </div>
        </div>

        <div
          className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_-35px_rgba(30,41,59,0.42)]"
          role="region"
          aria-roledescription="carousel"
          aria-label="Job search guidance"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") showSlide(activeIndex - 1);
            if (event.key === "ArrowRight") showSlide(activeIndex + 1);
          }}
        >
          <div
            className="flex touch-pan-y transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => { pointerStart.current = null; }}
          >
            {slides.map((slide) => (
              <article key={slide.title} className="min-w-full p-7 sm:p-10 lg:p-14" aria-hidden={slides[activeIndex].title !== slide.title}>
                <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                  <div>
                    <span className={`inline-flex h-3 w-12 rounded-full ${slide.accent}`} aria-hidden="true" />
                    <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-slate-400">{slide.eyebrow}</p>
                  </div>
                  <div>
                    <h3 className="max-w-2xl text-2xl font-bold leading-tight tracking-tight text-slate-950 sm:text-3xl">{slide.title}</h3>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{slide.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-center gap-2" aria-label="Choose a career note">
          {slides.map((slide, index) => (
            <button key={slide.title} type="button" onClick={() => showSlide(index)} className={`h-2 rounded-full transition-all ${index === activeIndex ? "w-8 bg-indigo-600" : "w-2 bg-slate-300 hover:bg-slate-400"}`} aria-label={`Show career note ${index + 1}`} aria-current={index === activeIndex ? "true" : undefined} />
          ))}
        </div>
      </div>
    </section>
  );
}
