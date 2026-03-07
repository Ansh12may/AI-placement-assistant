export default function ResumeResult({ data }) {
  return (
    <div className="mt-8 space-y-6">
      {/* Job Title */}
      <h2 className="text-2xl font-bold">
        Suggested Role: {data.job_title}
      </h2>

      {/* Contact Info */}
      <section>
        <h3 className="font-semibold">Contact Info</h3>
        <p>Email: {data.contact_info.email || "Not found"}</p>
        <p>Phone: {data.contact_info.phone || "Not found"}</p>
      </section>

      {/* Skills */}
      <section>
        <h3 className="font-semibold">Skills</h3>
        {data.skills.length === 0 ? (
          <p>No skills detected</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, i) => (
              <span
                key={i}
                className="bg-blue-100 px-2 py-1 rounded text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Education */}
      <section>
        <h3 className="font-semibold">Education</h3>
        <ul className="list-disc ml-5">
          {data.education.map((edu, i) => (
            <li key={i}>{edu}</li>
          ))}
        </ul>
      </section>

      {/* Experience */}
      <section>
        <h3 className="font-semibold">Experience</h3>
        {data.experience.length === 0 ? (
          <p className="text-gray-500">
            No formal experience detected (projects may exist)
          </p>
        ) : (
          <ul className="list-disc ml-5">
            {data.experience.map((exp, i) => (
              <li key={i}>{exp}</li>
            ))}
          </ul>
        )}
      </section>

      {/* Keywords */}
      <section>
        <h3 className="font-semibold">ATS Keywords</h3>
        <div className="flex flex-wrap gap-2">
          {data.keywords.map((kw, i) => (
            <span
              key={i}
              className="bg-gray-200 px-2 py-1 rounded text-xs"
            >
              {kw}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
