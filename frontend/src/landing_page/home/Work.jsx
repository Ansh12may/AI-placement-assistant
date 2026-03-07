export default function Work() {
  const steps = [
    {
      step: "01",
      title: "Upload Your Resume",
      desc: "Upload your PDF or TXT resume to your Placeko dashboard. Our AI instantly begins parsing your skills, experience, and keywords."
    },
    {
      step: "02",
      title: "Get Your ATS Score",
      desc: "Receive a detailed resume score with feedback on ATS compatibility, keyword match, formatting, and skill gaps."
    },
    {
      step: "03",
      title: "Match With Jobs",
      desc: "Based on your resume, Placeko finds the most relevant job listings and shows you how well your profile matches each role."
    },
    {
      step: "04",
      title: "Prepare & Apply",
      desc: "Practice with AI-generated interview questions, generate a tailored cover letter, and track every application — all in one place."
    }
  ];

  return (
    <section className="bg-white py-24">
      <div className="max-w-5xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900">
            How Placeko Works
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">
            From uploading your resume to landing interviews — Placeko guides you
            through every step of your job search using AI.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((item, idx) => (
            <div key={idx} className="flex gap-6 items-start bg-slate-50 border border-slate-200 rounded-2xl p-8 hover:shadow-md transition">
              <div className="flex-shrink-0">
                <div className="h-14 w-14 flex items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg">
                  {item.step}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}