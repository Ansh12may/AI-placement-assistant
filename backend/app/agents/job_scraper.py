import random
from urllib.parse import urlencode


class JobScraper:
    """
    Fallback job discovery service.
    Generates realistic job listings with valid search/apply links
    when real job APIs are unavailable.
    """

    def __init__(self):
        self.platform_urls = {
            "Indeed": "https://www.indeed.com/jobs",
            "LinkedIn": "https://www.linkedin.com/jobs/search",
            "Glassdoor": "https://www.glassdoor.com/Job/jobs.htm",
            "ZipRecruiter": "https://www.ziprecruiter.com/candidate/search",
            "Monster": "https://www.monster.com/jobs/search",
        }

        self.companies = [
            "Acme Tech",
            "InnoTech Solutions",
            "Global Systems",
            "TechCorp",
            "Digital Ventures"
        ]

        self.roles = [
            "Engineer",
            "Developer",
            "Analyst",
            "Specialist",
            "Consultant"
        ]

    def search_jobs(self, keywords, location, platform="Indeed", count=5):

        platform = platform if platform in self.platform_urls else "Indeed"

        query_params = urlencode({
            "q": keywords,
            "l": location
        })

        search_url = f"{self.platform_urls[platform]}?{query_params}"

        jobs = []

        for _ in range(count):
            jobs.append({
                "title": f"{keywords} {random.choice(self.roles)}",
                "company": random.choice(self.companies),
                "location": location,
                "description": f"Looking for a {keywords} professional with strong technical skills.",
                "url": search_url,
                "apply_url": search_url,
                "date_posted": f"{random.randint(1,7)} days ago",
                "platform": platform,
                "job_type": random.choice(["Full-time", "Remote", "Hybrid"]),
                "is_real_job": False
            })

        return jobs