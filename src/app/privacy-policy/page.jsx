"use client";

import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 px-4 py-10 md:px-16">
      <div className="max-w-5xl mx-auto mb-15">
        {/* HERO */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-700 p-5 rounded-2xl shadow-lg">
              <img
                src="/logo.png"
                alt="Nepogames Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            How Nepogames collects, uses, and protects your data.
          </p>

          <p className="text-sm text-gray-400 mt-3">Last Updated: 06/04/2026</p>
        </div>

        {/* CONTENT */}
        <div className="grid gap-6">
          {sections.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition"
            >
              <h2 className="text-lg font-semibold mb-3">{section.title}</h2>
              <div className="text-gray-600 text-sm leading-relaxed">
                {section.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const sections = [
  {
    title: "1. Introduction",
    content: (
      <p>
        <span className="font-semibold">Nepogames</span> ("we", "our", "us") is
        committed to protecting your privacy. This Privacy Policy explains how
        we collect, use, and safeguard your information when you use our
        platform.
      </p>
    ),
  },
  {
    title: "2. Information We Collect",
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Personal data (name, email address, phone number)</li>
        <li>Account credentials (securely stored and encrypted)</li>
        <li>Transaction and payment-related data</li>
        <li>Usage data (pages visited, interactions)</li>
        <li>Device and browser information</li>
      </ul>
    ),
  },
  {
    title: "3. How We Use Your Information",
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Create and manage accounts</li>
        <li>Facilitate transactions between users</li>
        <li>Hold payments until delivery is confirmed</li>
        <li>Improve platform performance</li>
        <li>Send updates and support messages</li>
      </ul>
    ),
  },
  {
    title: "4. Payments and Transactions",
    content: (
      <p>
        Nepogames acts as an intermediary between users. Payments may be held
        temporarily until delivery is confirmed. We do not store full financial
        details; payments are processed by trusted third-party providers.
      </p>
    ),
  },
  {
    title: "5. Sharing of Information",
    content: (
      <p>
        We do not sell your data. We may share data with trusted services such
        as hosting, analytics, email providers, and payment processors to
        operate the platform.
      </p>
    ),
  },
  {
    title: "6. Data Security",
    content: (
      <p>
        We use encryption, secure storage, and access controls to protect your
        data. However, no system is fully secure.
      </p>
    ),
  },
  {
    title: "7. Data Retention",
    content: (
      <p>
        We retain data only as long as necessary to provide services, comply
        with legal obligations, and resolve disputes.
      </p>
    ),
  },
  {
    title: "8. Your Rights",
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Access and update your data</li>
        <li>Request deletion of your data</li>
        <li>Opt out of marketing communications</li>
      </ul>
    ),
  },
  {
    title: "9. Age Restriction",
    content: (
      <p>
        Nepogames is accessible to users aged 3 and above. Users under 13 must
        use the platform under parental supervision.
      </p>
    ),
  },
  {
    title: "10. Cookies",
    content: (
      <p>
        We use cookies to improve user experience, analyze traffic, and enhance
        performance.
      </p>
    ),
  },
  {
    title: "11. Jurisdiction",
    content: (
      <p>
        This Privacy Policy is governed by the laws of the Federal Republic of
        Nigeria.
      </p>
    ),
  },
  {
    title: "12. Changes to This Policy",
    content: (
      <p>
        We may update this Privacy Policy at any time. Updates will be reflected
        on this page.
      </p>
    ),
  },
  {
    title: "13. Contact Us",
    content: <p>support@nepogames.com</p>,
  },
];
