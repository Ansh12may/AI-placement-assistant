import React from 'react';

import { useState } from "react";

export default function FAQ() {
  const faqs = [
    {
      q: "What is Placeko?",
      a: "Placeko is an AI-powered recruitment platform that helps job seekers optimize their resumes and prepare for interviews, while helping recruiters shortlist candidates faster and smarter."
    },
    {
      q: "Is the resume scan free?",
      a: "Yes. You can scan your resume for free and receive an AI-generated report with ATS score, formatting feedback, and improvement tips."
    },
    {
      q: "How does the AI resume checker work?",
      a: "Our AI analyzes your resume’s structure, keywords, grammar, formatting, and impact. It compares your resume against ATS rules and job requirements to generate actionable suggestions."
    },
    {
      q: "Will my resume pass ATS systems?",
      a: "Placeko is designed to optimize resumes for Applicant Tracking Systems (ATS). While no tool can guarantee results, our checker significantly improves ATS compatibility."
    },
    {
      q: "Do I need to sign up to scan my resume?",
      a: "No signup is required for a basic resume scan. However, creating an account lets you save versions, apply fixes instantly, and track improvements."
    },
    {
      q: "What file formats are supported?",
      a: "You can upload resumes in PDF and DOCX formats. Download your optimized resume in your preferred format."
    },
    {
      q: "Is my resume data safe?",
      a: "Yes. Your data is encrypted and never shared with third parties. You can delete your resume and account at any time."
    },
    {
      q: "Can recruiters use Placeko?",
      a: "Yes. Recruiters can use Placeko to screen resumes, score candidates, and generate interview questions using AI agents."
    }
  ];

  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="bg-slate-50 py-24">
      <div className="max-w-4xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Everything you need to know about Placeko and our AI resume checker.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <button
                className="w-full flex justify-between items-center p-6
                           text-left font-medium text-slate-900
                           hover:bg-slate-100 transition"
                onClick={() =>
                  setOpenIndex(openIndex === idx ? null : idx)
                }
              >
                {item.q}
                <span className="text-indigo-600 text-xl">
                  {openIndex === idx ? "−" : "+"}
                </span>
              </button>

              {openIndex === idx && (
                <div className="px-6 pb-6 text-slate-600">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
