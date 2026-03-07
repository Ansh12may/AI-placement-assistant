export default function LeftSection() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-6 space-y-32">

        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900">
            Everything You Need to Land Your Next Job
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            From resume scanning to interview prep — Placeko gives you AI-powered
            tools for every step of your job search.
          </p>
        </div>

        {/* ROW 1 — Visual Left, Content Right */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-16 items-center">

          {/* Visual */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-6">Resume Analysis</h4>
            {[
              { label: "ATS Compatibility", score: 92, color: "bg-emerald-500" },
              { label: "Keyword Match",     score: 78, color: "bg-indigo-500"  },
              { label: "Formatting",        score: 95, color: "bg-emerald-500" },
              { label: "Impact Language",   score: 70, color: "bg-amber-500"   },
            ].map((item) => (
              <div key={item.label} className="mb-5">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-800">{item.score}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
            <div className="mt-6 flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
              <span className="text-2xl">📄</span>
              <div>
                <p className="text-sm font-semibold text-indigo-800">Overall Score: 87%</p>
                <p className="text-xs text-indigo-600">Strong resume — a few improvements can make it excellent</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <Feature
              icon="🎯"
              title="ATS Score & Feedback"
              desc="Upload your resume and instantly get an ATS compatibility score with detailed feedback on keywords, formatting, and skill gaps."
            />
            <Feature
              icon="🔍"
              title="Keyword Analysis"
              desc="See exactly which keywords are missing from your resume based on your target job title and industry."
            />
            <Feature
              icon="📊"
              title="Skill Gap Detection"
              desc="Identify missing skills employers are looking for and know exactly what to add to improve your chances."
            />
            <Feature
              icon="⚡"
              title="Instant Results"
              desc="No waiting — get your full resume analysis in seconds, right after uploading your PDF or TXT file."
            />
          </div>
        </div>

        {/* ROW 2 — Content Left, Visual Right */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-16 items-center">

          {/* Content */}
          <div className="space-y-8">
            <Feature
              icon="💼"
              title="AI Job Matching"
              desc="Based on your resume, Placeko finds the most relevant jobs and shows you how well your profile matches each listing."
            />
            <Feature
              icon="🎤"
              title="Interview Preparation"
              desc="Practice with AI-generated interview questions tailored to your target role — behavioral, technical, and system design."
            />
            <Feature
              icon="✉️"
              title="Cover Letter Generator"
              desc="Paste a job description and get a personalized, professional cover letter written by AI in seconds."
            />
            <Feature
              icon="🗂️"
              title="Application Tracker"
              desc="Track every job application through a Kanban board — from saved to applied to offer, all in one place."
            />
          </div>

          {/* Visual */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-6">Application Tracker</h4>
            <div className="space-y-3">
              {[
                { company: "Google",    role: "Frontend Engineer",   status: "Interview", color: "bg-violet-100 text-violet-700" },
                { company: "Atlassian", role: "React Developer",     status: "Applied",   color: "bg-blue-100 text-blue-700"    },
                { company: "Razorpay",  role: "Software Engineer",   status: "Offer 🎉",  color: "bg-emerald-100 text-emerald-700"},
                { company: "Swiggy",    role: "Full Stack Developer", status: "Saved",     color: "bg-slate-100 text-slate-700"  },
              ].map((item) => (
                <div key={item.company} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.company}</p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="flex gap-4">
      <span className="text-2xl shrink-0 mt-1">{icon}</span>
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-1">{title}</h3>
        <p className="text-slate-600">{desc}</p>
      </div>
    </div>
  );
}