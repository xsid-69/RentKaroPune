"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function MotionDirector() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.dataset.motion = "full";

    const lenis = new Lenis({
      lerp: 0.07,
      wheelMultiplier: 0.92,
      smoothWheel: true,
      touchMultiplier: 1.15,
    });
    const update = (time) => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    window.__rentKaroLenis = lenis;
    window.__rentKaroMotion = { gsap, ScrollTrigger };

    const handleAnchor = (event) => {
      const anchor = event.target.closest('a[href^="#"]');
      if (!anchor) return;
      const target = document.querySelector(anchor.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -96, duration: 1.2 });
    };
    document.addEventListener("click", handleAnchor);
    return () => {
      document.removeEventListener("click", handleAnchor);
      gsap.ticker.remove(update);
      lenis.destroy();
      delete window.__rentKaroLenis;
      delete window.__rentKaroMotion;
    };
  }, []);

  useGSAP(() => {
    const scope = document.getElementById("main-content");
    if (!scope) return;

    const motionRoot = scope.querySelector("[data-motion-root]");
    const heroRoot = scope.querySelector("[data-hero-root]") || motionRoot?.querySelector(":scope > section:first-of-type");
    const heroWorld = scope.querySelector("[data-hero-world]") || heroRoot?.querySelector("[data-hero-media]");
    const heroPhoto = scope.querySelector("[data-hero-photo]") || heroWorld?.querySelector(":scope > [data-parallax-media]");
    const heroOrbitPath = scope.querySelector("[data-hero-orbit-path]") || heroWorld?.querySelector(":scope > svg[aria-hidden='true']");
    heroRoot?.setAttribute("data-hero-root", "");
    heroWorld?.setAttribute("data-hero-world", "");
    heroPhoto?.setAttribute("data-hero-photo", "");
    heroOrbitPath?.setAttribute("data-hero-orbit-path", "");

    const entrance = gsap.timeline({ defaults: { ease: "power4.out" } });
    entrance
      .from(scope.querySelectorAll("[data-hero-line]"), { yPercent: 105, autoAlpha: 0, duration: 1.15, stagger: 0.11 })
      .from(scope.querySelectorAll("[data-hero-copy]"), { y: 28, autoAlpha: 0, duration: 0.8, stagger: 0.08 }, "-=0.7")
      .from(scope.querySelectorAll("[data-hero-media]"), { clipPath: "inset(14% 14% 14% 14% round 30px)", scale: 1.08, autoAlpha: 0, duration: 1.35 }, "-=1.0")
      .from(scope.querySelectorAll("[data-search-dock]"), { y: 42, autoAlpha: 0, duration: 0.85 }, "-=0.65");

    if (heroRoot) {
      gsap.to(scope.querySelectorAll("[data-hero-orbit]"), { rotate: 360, duration: 22, repeat: -1, ease: "none" });
      gsap.to(scope.querySelectorAll("[data-hero-orbit-path]"), { rotate: 340, duration: 38, repeat: -1, ease: "none", transformOrigin: "50% 50%" });
      gsap.to(scope.querySelectorAll("[data-hero-ghost]"), {
        xPercent: -12,
        ease: "none",
        scrollTrigger: { trigger: heroRoot, start: "top top", end: "bottom top", scrub: 1 },
      });
      gsap.to(scope.querySelectorAll("[data-hero-world]"), {
        yPercent: 13,
        ease: "none",
        scrollTrigger: { trigger: heroRoot, start: "top top", end: "bottom top", scrub: 1 },
      });
      gsap.to(scope.querySelectorAll("[data-hero-photo]"), {
        scale: 1.12,
        ease: "none",
        scrollTrigger: { trigger: heroRoot, start: "top top", end: "bottom top", scrub: 1 },
      });
    }

    const scrollProgress = document.querySelector("[data-scroll-progress]");
    if (scrollProgress) gsap.to(scrollProgress, {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.25 },
    });

    gsap.utils.toArray(scope.querySelectorAll("[data-reveal]")).forEach((element) => {
      gsap.from(element, {
        y: 64,
        autoAlpha: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: element, start: "top 88%", toggleActions: "play none none none" },
      });
    });

    gsap.utils.toArray(scope.querySelectorAll("[data-stagger]")).forEach((group) => {
      gsap.from(group.children, {
        y: 54,
        autoAlpha: 0,
        duration: 0.85,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: group, start: "top 82%", toggleActions: "play none none none" },
      });
    });

    gsap.utils.toArray(scope.querySelectorAll("[data-parallax-media]")).forEach((frame) => {
      const image = frame.querySelector("img");
      if (!image) return;
      gsap.fromTo(image, { yPercent: -7, scale: 1.08 }, {
        yPercent: 8,
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: 1 },
      });
    });

    const scrubText = scope.querySelector("[data-scrub-text]");
    const words = scrubText?.querySelectorAll("[data-scrub-word]") || [];
    if (words.length) {
      gsap.fromTo(words, { opacity: 0.14 }, {
        opacity: 1,
        stagger: 0.08,
        ease: "none",
        scrollTrigger: { trigger: scrubText, start: "top 75%", end: "bottom 45%", scrub: 1 },
      });
    }

    const journeyCards = gsap.utils.toArray(scope.querySelectorAll("[data-journey-card]"));
    journeyCards.forEach((card, index) => {
      gsap.from(card, {
        y: 110,
        rotate: index % 2 ? 1.4 : -1.2,
        autoAlpha: 0,
        scale: 0.94,
        ease: "power3.out",
        scrollTrigger: { trigger: card, start: "top 88%", end: "top 48%", scrub: 0.75 },
      });
      if (index < journeyCards.length - 1) {
        gsap.to(card, {
          scale: 0.965,
          opacity: 0.66,
          ease: "none",
          scrollTrigger: { trigger: journeyCards[index + 1], start: "top 82%", end: "top 28%", scrub: 0.65 },
        });
      }
    });

    gsap.utils.toArray(scope.querySelectorAll("[data-float]" )).forEach((element, index) => {
      gsap.to(element, { y: index % 2 ? 14 : -16, rotate: index % 2 ? 1.2 : -1, duration: 2.8 + index * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
    });

    gsap.utils.toArray(scope.querySelectorAll("[data-motion-reveal]:not([data-reveal])")).forEach((element, index) => {
      gsap.from(element, {
        y: index < 2 ? 34 : 52,
        autoAlpha: 0,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: { trigger: element, start: "top 90%", toggleActions: "play none none none" },
      });
    });

    const cleanups = [];
    scope.querySelectorAll("[data-magnetic]").forEach((element) => {
      const moveX = gsap.quickTo(element, "x", { duration: 0.45, ease: "power3.out" });
      const moveY = gsap.quickTo(element, "y", { duration: 0.45, ease: "power3.out" });
      const move = (event) => {
        const rect = element.getBoundingClientRect();
        moveX((event.clientX - rect.left - rect.width / 2) * 0.18);
        moveY((event.clientY - rect.top - rect.height / 2) * 0.18);
      };
      const leave = () => { moveX(0); moveY(0); };
      element.addEventListener("pointermove", move);
      element.addEventListener("pointerleave", leave);
      cleanups.push(() => { element.removeEventListener("pointermove", move); element.removeEventListener("pointerleave", leave); });
    });

    scope.querySelectorAll("[data-tilt]").forEach((element) => {
      const rotateX = gsap.quickTo(element, "rotateX", { duration: 0.5, ease: "power3.out" });
      const rotateY = gsap.quickTo(element, "rotateY", { duration: 0.5, ease: "power3.out" });
      const move = (event) => {
        const rect = element.getBoundingClientRect();
        rotateY(((event.clientX - rect.left) / rect.width - 0.5) * 7);
        rotateX(((event.clientY - rect.top) / rect.height - 0.5) * -7);
      };
      const leave = () => { rotateX(0); rotateY(0); };
      element.addEventListener("pointermove", move);
      element.addEventListener("pointerleave", leave);
      cleanups.push(() => { element.removeEventListener("pointermove", move); element.removeEventListener("pointerleave", leave); });
    });

    let active = true;
    const refresh = () => { if (active) ScrollTrigger.refresh(); };
    const refreshTimer = window.setTimeout(refresh, 180);
    const pendingImages = Array.from(scope.querySelectorAll("img")).filter((image) => !image.complete);
    pendingImages.forEach((image) => {
      image.addEventListener("load", refresh, { once: true });
      image.addEventListener("error", refresh, { once: true });
    });
    document.fonts?.ready.then(refresh).catch(() => {});

    return () => {
      active = false;
      window.clearTimeout(refreshTimer);
      pendingImages.forEach((image) => {
        image.removeEventListener("load", refresh);
        image.removeEventListener("error", refresh);
      });
      cleanups.forEach((cleanup) => cleanup());
    };
  }, { dependencies: [pathname], revertOnUpdate: true });

  return null;
}
