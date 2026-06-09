import React from "react";
import { Link } from "react-router-dom";
// import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-green-50">
      <main className="max-w-5xl mx-auto py-14 px-4 flex flex-col items-center">
        {/* <div className="bg-green-800 rounded-full p-10 flex items-center justify-center">
          <Heart className="h-16 w-16 text-white" />
        </div> */}
        {/* Logo Image */}
        <img
          src="/new_logo.png"
          alt="ShramiKare Logo"
          className="rounded-lg max-h-32 shadow mt-6 mb-2"
          onError={e => {
            e.target.onerror = null;
            e.target.src = "/sample_aadhar.png";
          }}
        />
        <h1 className="text-4xl mt-6 font-bold text-green-900">ShramiKare</h1>
        <p className="text-lg mt-2 text-green-700 font-medium">
          Care for the hands that build
        </p>
        <p className="text-center max-w-3xl text-green-700 mt-4 mb-6">
          A comprehensive Digital Health Record Management System designed specifically for migrant workers in Kerala. 
          Ensuring healthcare access, identity verification, outbreak tracking, and medical record management for every worker.
        </p>
        <Link
          to="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow transition"
        >
          Get Started <span className="ml-2">&#8594;</span>
        </Link>
      </main>

      {/* Key Features */}
      <section className="max-w-6xl mx-auto py-6 px-4">
        <h2 className="text-2xl mb-4 font-bold text-green-800 text-center">
          Key Features
        </h2>
        <p className="text-center text-green-700 mb-6">
          Comprehensive digital migrant healthcare management tools designed for simplicity and effectiveness.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* User Authentication */}
          <div className="bg-white p-6 rounded-xl shadow text-blue-800 border border-blue-300">
            <div className="mb-2 "><span className="text-2xl">🔒</span></div>
            <h3 className="font-bold text-lg">Secure Authentication</h3>
            <p className="text-green-700 mt-2 text-sm">
              OTP-based login for workers and coordinators. 
            </p>
          </div>
          {/* Healthcare Facility Registry */}
          <div className="bg-white p-6 rounded-xl shadow text-blue-800 border border-blue-300">
            <div className="mb-2"><span className="text-2xl">🏥</span></div>
            <h3 className="font-bold text-lg">Healthcare Facility Finder</h3>
            <p className="text-green-700 mt-2 text-sm">
              Lookup and contact verified healthcare facilities nearest to worker districts.
            </p>
          </div>
          {/* Outbreak and Health Alerts */}
          <div className="bg-white p-6 rounded-xl shadow text-blue-800 border border-blue-300">
            <div className="mb-2"><span className="text-2xl">⚠️</span></div>
            <h3 className="font-bold text-lg">Outbreak Detection & Alerts</h3>
            <p className="text-green-700 mt-2 text-sm">
              AI-powered outbreak prediction and timely health SMS reminders for every worker.
            </p>
          </div>
          {/* Digital Health ID */}
          <div className="bg-white p-6 rounded-xl shadow text-blue-800 border border-blue-300">
            <div className="mb-2"><span className="text-2xl">🆔</span></div>
            <h3 className="font-bold text-lg">Digital Health ID</h3>
            <p className="text-green-700 mt-2 text-sm">
              Secure identification and record management for every worker.
            </p>
          </div>
        </div>
      </section>

      {/* Empowerment Section */}
      <section className="max-w-6xl mx-auto py-10 flex flex-col md:flex-row items-center gap-8 px-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-green-900 mb-3">
            Empowering Migrant Workers with Digital Healthcare
          </h3>
          <ul className="text-green-700 space-y-2 text-base mb-3">
            <li>✅  AI-driven digital health alerts, reminders & outbreak notifications.</li>
            <li>✅  Easy access to trusted facilities and providers.</li>
            <li>✅  Comprehensive health record management for every worker.</li>
            <li>✅  OTP-based verification and government compliance.</li>
          </ul>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="rounded-full p-10 flex items-center justify-center">
            <img
            src="/new_logo.png"
            alt="ShramiKare Logo"
            className="rounded-lg max-h-32 shadow mt-6 mb-2"
            onError={e => {
              e.target.onerror = null;
              e.target.src = "/sample_aadhar.png";
            }}
          />
          </div>
          <div className="text-center">
            <h4 className="font-bold mb-1 text-green-800">Health & Care for Every Worker</h4>
            <p className="text-green-700 text-sm">
              Join thousands of workers registering for secure, accessible healthcare management.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
