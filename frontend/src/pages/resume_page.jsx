import React from "react";
import ResumeScan from "../landing_page/home/Resume_scan";

function ResumePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <ResumeScan />
      </div>
    </div>
  );
}

export default ResumePage;