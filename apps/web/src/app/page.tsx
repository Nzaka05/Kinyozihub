"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Barber {
  _id: string;
  shopName: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  distanceString?: string;
  profileImage?: string;
  isVerified?: boolean;
}

export default function LandingPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBarbers() {
      try {
        const response = await api.get("/barbers");
        if (response.data?.success) {
          setBarbers(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch barbers:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBarbers();
  }, []);

  // Horizontal scroll logic
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setIsDown(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeft(el.scrollLeft);
  };
  const handleMouseLeave = () => setIsDown(false);
  const handleMouseUp = () => setIsDown(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown) return;
    e.preventDefault();
    const el = scrollContainerRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 2;
    el.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="bg-surface text-on-surface font-body-lg text-body-lg overflow-x-hidden min-h-screen">
      {/* Top Navigation Bar */}
      <header className="w-full h-16 bg-surface border-b border-outline-variant z-50 sticky top-0">
        <nav className="flex justify-between items-center px-container-margin max-w-7xl mx-auto h-full">
          <div className="text-headline-md font-headline-md font-bold text-primary">KinyoziHub</div>
          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-xl">
            <a href="#featured-barbers" className="text-primary font-bold border-b-2 border-primary py-1">
              Find Barbers
            </a>
            <a href="#for-professionals" className="text-on-surface-variant hover:text-primary transition-colors">
              For Professionals
            </a>
            <a href="#how-it-works" className="text-on-surface-variant hover:text-primary transition-colors">
              How it Works
            </a>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-md">
            <Link
              href="/login"
              className="hidden sm:block text-on-surface-variant font-label-bold text-label-bold hover:underline"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="bg-primary text-on-primary px-lg py-sm rounded-xl font-label-bold text-label-bold transition-all active:opacity-80"
            >
              Join Now
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Section 1: Hero */}
        <section className="relative px-container-margin py-xl md:py-24 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-xl items-center">
          <div className="space-y-lg z-10">
            <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface leading-tight">
              Book Top-Rated Barbers Near You
            </h1>
            <p className="text-on-surface-variant text-body-lg max-w-lg">
              Skip the queue and the walk-in chaos. Compare prices, see ratings, and book your next cut instantly.
            </p>
            <div className="flex flex-col sm:flex-row gap-md pt-base">
              <a
                href="#featured-barbers"
                className="bg-accent-coral text-white px-xl py-md rounded-xl font-label-bold text-label-bold custom-shadow hover:brightness-110 active:scale-95 transition-all text-center block"
              >
                Find a Barber
              </a>
              <Link
                href="/login"
                className="border border-on-surface text-on-surface px-xl py-md rounded-xl font-label-bold text-label-bold hover:bg-surface-container-low active:scale-95 transition-all text-center block"
              >
                I'm a Barber — Join Free
              </Link>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary-fixed opacity-20 rounded-full blur-3xl group-hover:opacity-30 transition-opacity"></div>
            <div className="relative rounded-2xl overflow-hidden custom-shadow aspect-[4/3] w-full">
              <img
                className="object-cover w-full h-full"
                alt="A cinematic, high-quality photograph of a professional Kenyan barber meticulously detailing a client's fade in a clean, modern barbershop."
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYW0pCtHoHLK_T0JuorYN5Z8mFNm9C9OyfJ274RtOWBEyRJ42RQytOdYk-zKPwrWEz4-MiQG0U4_A9w9nI_ndDkyDKv3gqx-QZBQYSt-4vHxiILexmi-MIQIWkDbr7UBqyNEZ1eFc-gOuDMeFHysff3Xk3aaYC5E5u_v3qqGp5RRBtNWFLQseHbyoqECyPoCjLUUrxF3IbpvYJXADXwjKQVFPvJ-cYvgu6pGoKFK1I6KIcbgkxyS0UZ2SuhPbvesIzWxyWVtJk7aMt"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Value Props */}
        <section className="bg-surface-container-low py-24">
          <div className="max-w-7xl mx-auto px-container-margin grid grid-cols-1 md:grid-cols-3 gap-xl text-center">
            <div className="p-lg space-y-md">
              <div className="bg-primary-container/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-lg">
                <span className="material-symbols-outlined text-primary text-3xl">schedule</span>
              </div>
              <h3 className="font-headline-md text-headline-md">Book in under 3 minutes</h3>
              <p className="text-on-surface-variant text-body-sm">
                Intuitive scheduling that respects your time. No more waiting on the bench.
              </p>
            </div>
            <div className="p-lg space-y-md">
              <div className="bg-secondary-container/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-lg">
                <span className="material-symbols-outlined text-secondary text-3xl">payments</span>
              </div>
              <h3 className="font-headline-md text-headline-md">Transparent prices before you go</h3>
              <p className="text-on-surface-variant text-body-sm">
                Know exactly what you'll pay. Browse service menus and specialized packages.
              </p>
            </div>
            <div className="p-lg space-y-md">
              <div className="bg-tertiary-fixed/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-lg">
                <span className="material-symbols-outlined text-tertiary text-3xl">trending_up</span>
              </div>
              <h3 className="font-headline-md text-headline-md">Grow your income &amp; fill your calendar</h3>
              <p className="text-on-surface-variant text-body-sm">
                For barbers: a digital storefront to showcase your craft and attract premium clients.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: How it Works */}
        <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-container-margin">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg mb-base">How it Works</h2>
            <div className="h-1 w-16 bg-accent-coral mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl relative">
            {/* Connector lines for desktop */}
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-px border-t border-dashed border-outline-variant -z-10"></div>
            
            <div className="flex flex-col items-center text-center space-y-md">
              <div className="bg-on-surface text-surface w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">1</div>
              <h4 className="font-label-bold text-lg">Search your area</h4>
              <p className="text-on-surface-variant text-body-sm px-md">Find the best hands in Nairobi, Mombasa, or right in your neighborhood.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-md">
              <div className="bg-on-surface text-surface w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">2</div>
              <h4 className="font-label-bold text-lg">Compare barbers</h4>
              <p className="text-on-surface-variant text-body-sm px-md">Filter by rating, price, or specific styles like Dreads or Skin Fades.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-md">
              <div className="bg-on-surface text-surface w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">3</div>
              <h4 className="font-label-bold text-lg">Book instantly</h4>
              <p className="text-on-surface-variant text-body-sm px-md">Confirm your slot with a single tap and get real-time reminders.</p>
            </div>
          </div>
        </section>

        {/* Section 4: Featured Barbers */}
        <section id="featured-barbers" className="bg-surface-container py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-container-margin">
            <div className="flex justify-between items-end mb-lg">
              <div>
                <h2 className="font-headline-lg text-headline-lg">Top-Rated Near You</h2>
                <p className="text-on-surface-variant">Verified professionals with outstanding reviews</p>
              </div>
              <Link href="/login" className="text-accent-coral font-label-bold flex items-center gap-xs hover:underline">
                View all <span className="material-symbols-outlined">chevron_right</span>
              </Link>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center items-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : barbers.length > 0 ? (
              <div
                ref={scrollContainerRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className="flex gap-lg overflow-x-auto pb-xl hide-scrollbar snap-x snap-mandatory cursor-grab active:cursor-grabbing"
              >
                {barbers.map((barber) => (
                  <div
                    key={barber._id}
                    className="flex-none w-72 md:w-80 bg-surface rounded-2xl overflow-hidden border border-border-light custom-shadow snap-start"
                  >
                    <div className="relative h-48 bg-gray-200">
                      {barber.profileImage ? (
                        <img
                          className="w-full h-full object-cover"
                          alt={barber.shopName}
                          src={barber.profileImage}
                          draggable="false"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="material-symbols-outlined text-4xl">storefront</span>
                        </div>
                      )}
                      {barber.rating !== undefined ? (
                        <div className="absolute top-md right-md bg-white/90 backdrop-blur-sm px-sm py-xs rounded-full flex items-center gap-xs font-label-bold text-label-bold">
                          <span
                            className="material-symbols-outlined text-sm text-yellow-500"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          {barber.rating > 0 ? barber.rating.toFixed(1) : "New"}
                        </div>
                      ) : null}
                    </div>
                    <div className="p-md space-y-xs">
                      <div className="flex items-center justify-between">
                        <h3 className="font-label-bold text-body-lg truncate" title={barber.shopName}>
                          {barber.shopName}
                        </h3>
                        {barber.isVerified && (
                          <span className="material-symbols-outlined text-primary text-sm" title="Verified">verified</span>
                        )}
                      </div>
                      <p className="text-on-surface-variant text-body-sm truncate">
                        {barber.distanceString || "Location not set"}
                      </p>
                      <div className="flex items-center justify-between pt-sm">
                        <p className="font-price-display text-price-display text-on-surface">
                          {barber.priceRange || "Contact for price"} <span className="text-xs font-normal text-on-surface-variant"></span>
                        </p>
                        <Link href={`/login`} className="text-accent-coral font-label-bold text-sm hover:underline">
                          Book
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface rounded-2xl p-xl text-center border border-border-light">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">event_busy</span>
                <h3 className="font-headline-md mb-2">No barbers found in your area yet</h3>
                <p className="text-on-surface-variant text-body-sm mb-6">We're expanding fast! Check back soon or join as a professional.</p>
                <Link
                  href="/login"
                  className="bg-primary text-on-primary px-lg py-sm rounded-xl font-label-bold text-label-bold inline-block"
                >
                  I'm a Barber — Join Free
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Section 5: Barber Pitch */}
        <section id="for-professionals" className="py-24 max-w-7xl mx-auto px-container-margin">
          <div className="bg-on-secondary-fixed text-white rounded-2xl p-xl md:p-24 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
              <span className="material-symbols-outlined text-[300px] text-white rotate-12">content_cut</span>
            </div>
            <div className="relative z-10 max-w-2xl space-y-lg">
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg">
                Are you a professional barber? Get discovered, get booked, get paid.
              </h2>
              <p className="text-on-secondary-container text-body-lg font-medium">
                Free to start — Pro plans from KES 500/mo.
              </p>
              <p className="text-surface-variant text-body-sm">
                Join the 1,500+ barbers already growing their businesses with KinyoziHub tools for booking, marketing, and client management.
              </p>
              <div className="pt-md">
                <Link
                  href="/login"
                  className="bg-surface text-on-surface px-xl py-md rounded-xl font-label-bold text-label-bold hover:bg-surface-container-high transition-all active:scale-95 inline-block"
                >
                  Create your profile
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-highest py-xl mt-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg px-container-margin max-w-7xl mx-auto">
          <div className="space-y-md">
            <div className="text-headline-md font-headline-md font-bold text-on-surface">KinyoziHub</div>
            <p className="text-on-surface-variant text-body-sm">
              Made for Kenya's barber economy. Empowering barbers, delighting clients.
            </p>
          </div>
          <div className="space-y-sm">
            <h5 className="font-label-bold">Explore</h5>
            <ul className="space-y-xs text-on-surface-variant text-body-sm">
              <li><a href="#featured-barbers" className="hover:underline transition-all">Find Barbers</a></li>
              <li><a href="#for-professionals" className="hover:underline transition-all">For Professionals</a></li>
              <li><a href="#" className="hover:underline transition-all">Community Guidelines</a></li>
            </ul>
          </div>
          <div className="space-y-sm">
            <h5 className="font-label-bold">Company</h5>
            <ul className="space-y-xs text-on-surface-variant text-body-sm">
              <li><a href="#" className="hover:underline transition-all">About Us</a></li>
              <li><a href="#" className="hover:underline transition-all">Careers</a></li>
              <li><a href="#" className="hover:underline transition-all">Privacy Policy</a></li>
              <li><a href="#" className="hover:underline transition-all">Terms of Service</a></li>
            </ul>
          </div>
          <div className="space-y-sm">
            <h5 className="font-label-bold">Support</h5>
            <ul className="space-y-xs text-on-surface-variant text-body-sm">
              <li><a href="#" className="hover:underline transition-all">Contact Support</a></li>
              <li><a href="#" className="hover:underline transition-all">FAQ</a></li>
              <li><a href="#" className="hover:underline transition-all">Safety Center</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-container-margin mt-xl pt-lg border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-md">
          <p className="text-body-sm text-on-surface-variant">© 2024 KinyoziHub. All rights reserved.</p>
          <div className="flex gap-md">
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">face_nod</span>
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">language</span>
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">alternate_email</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
