import { useNavigate } from "react-router-dom";

export default function Resume_checker() {
  const navigate = useNavigate();

  const features = [
    { icon: "📏", title: "Optimal Length",      desc: "Most employers prefer a one-page resume. Our ATS checker helps you highlight strengths clearly." },
    { icon: "✏️", title: "Fix Typos",           desc: "A polished resume is free of grammar mistakes. Our analyzer catches errors before you apply." },
    { icon: "📋", title: "Comprehensiveness",   desc: "Ensure your resume checks all the right boxes with key details employers expect." },
    { icon: "📈", title: "Measurable Results",  desc: "Add clear, measurable achievements to strengthen your resume and stand out." },
    { icon: "💬", title: "Word Choice",         desc: "Use strong action verbs. Our AI suggests powerful language that highlights your impact." },
    { icon: "🎨", title: "Formatting",          desc: "Clean formatting helps you pass ATS and impress recruiters with an optimized layout." },
    { icon: "🎯", title: "Strong Summary",      desc: "Hook hiring managers instantly with a compelling summary crafted by AI." },
    { icon: "🔧", title: "Customization",       desc: "Choose a job title and get the most relevant skills and keywords tailored to your role." },
  ];

  return (
    <section className="bg-slate-50 py-24">
      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-slate-900">
            Why You Should Use Our Resume Checker
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Our AI-powered resume checker helps you build a resume that passes ATS,
            impresses recruiters, and gets more interviews.
          </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition">
                <span className="text-2xl">{item.icon}</span>
                <h3 className="text-sm font-semibold text-slate-900 mt-2 mb-1">{item.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Right Side — Score Preview */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Your Resume Score</h3>

              {/* Score Circle */}
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-indigo-500 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-indigo-600">87%</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Good Resume</p>
                  <p className="text-sm text-slate-500 mt-1">A few improvements can make it excellent</p>
                </div>
              </div>

              {/* Score Breakdown */}
              {[
                { label: "ATS Compatibility", score: 92, color: "bg-emerald-500" },
                { label: "Keyword Match",     score: 78, color: "bg-indigo-500"  },
                { label: "Formatting",        score: 95, color: "bg-emerald-500" },
                { label: "Impact Language",   score: 70, color: "bg-amber-500"   },
              ].map((item) => (
                <div key={item.label} className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-medium text-slate-800">{item.score}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.score}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/resume")}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition text-sm"
            >
              Check My Resume →
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}