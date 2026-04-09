"use client";

import React from "react";

export default function TermsOfService() {
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

          <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            These terms govern your use of Nepogames. Use of the platform means
            you fully accept these terms.
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
              <div className="text-gray-600 text-sm leading-relaxed space-y-2">
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
    title: "1. Acceptance of Terms",
    content: (
      <p>
        By using Nepogames, you agree to be legally bound by these Terms. If
        you do not agree, you must not use the platform.
      </p>
    ),
  },
  {
    title: "2. Eligibility",
    content: (
      <p>
        The platform is accessible to users aged 3+. Users under 13 must use the
        platform under parental supervision. By using Nepogames, you confirm
        you meet these requirements.
      </p>
    ),
  },
  {
    title: "3. User Accounts",
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>You are fully responsible for your account and credentials</li>
        <li>All activities under your account are your responsibility</li>
        <li>
          Providing false or misleading information may result in termination
        </li>
      </ul>
    ),
  },
  {
    title: "4. Transactions & Escrow",
    content: (
      <p>
        Nepogames acts strictly as an intermediary. Payments may be held
        temporarily until delivery is confirmed. "Delivery" is defined as
        successful transfer of account access and control to the buyer,
        including valid login credentials.
      </p>
    ),
  },
  {
    title: "5. Refund Policy",
    content: (
      <p>
        All transactions are generally final. However, refunds may be issued at
        the sole discretion of Nepogames in cases where the seller fails to
        deliver valid login details or the account significantly differs from
        what was advertised. Evidence may be required before any decision is
        made.
      </p>
    ),
  },
  {
    title: "6. Account Trading Risk",
    content: (
      <p>
        Users acknowledge that buying or selling accounts carries inherent
        risks. Nepogames does not guarantee account longevity, security, or
        protection from recovery by original owners. All transactions are
        conducted at your own risk.
      </p>
    ),
  },
  {
    title: "7. Fraud & Abuse",
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Fraudulent activity will result in immediate suspension</li>
        <li>Accounts involved in scams may be permanently banned</li>
        <li>Funds linked to fraudulent activity may be withheld</li>
      </ul>
    ),
  },
  {
    title: "8. Dispute Resolution",
    content: (
      <p>
        Nepogames may intervene in disputes at its discretion. All decisions
        made by Nepogames are final and binding. We are not obligated to
        resolve disputes.
      </p>
    ),
  },
  {
    title: "9. Platform Authority",
    content: (
      <p>
        We reserve full rights to suspend, terminate, or restrict access to any
        account at our sole discretion, without prior notice.
      </p>
    ),
  },
  {
    title: "10. Fees & Charges",
    content: (
      <p>
        Nepogames reserves the right to introduce fees, commissions, or service
        charges at any time. Continued use of the platform implies acceptance of
        such fees.
      </p>
    ),
  },
  {
    title: "11. Limitation of Liability",
    content: (
      <p>
        Nepogames shall not be liable for any losses, including financial loss,
        data loss, or damages arising from use of the platform or transactions
        between users.
      </p>
    ),
  },
  {
    title: "12. Third-Party Services",
    content: (
      <p>
        The platform relies on third-party services (payments, hosting,
        analytics). We are not responsible for their performance or failures.
      </p>
    ),
  },
  {
    title: "13. Changes to Terms",
    content: (
      <p>
        We may update these Terms at any time. Continued use of the platform
        constitutes acceptance of the updated Terms.
      </p>
    ),
  },
  {
    title: "14. Governing Law",
    content: (
      <p>
        These Terms are governed by the laws of the Federal Republic of Nigeria.
      </p>
    ),
  },
  {
    title: "15. Contact",
    content: <p>support@nepogames.com</p>,
  },
];
