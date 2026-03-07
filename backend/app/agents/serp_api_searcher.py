import os
import requests

SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")


class SerpApiSearcher:

    def search_jobs(self, keywords, location, platform=None, count=5, skills=None):

        if not SERPAPI_API_KEY:
            return []

        try:
            url = "https://serpapi.com/search"

            # Include top 3 resume skills in query for better results
            query = keywords
            if skills:
                query = f"{keywords} {' '.join(skills[:3])}"
            query += f" jobs in {location}"

            if platform and platform.lower() not in ("all", ""):
                query += f" {platform}"

            params = {
                "engine":  "google_jobs",
                "q":       query,
                "hl":      "en",
                "api_key": SERPAPI_API_KEY,
            }

            response = requests.get(url, params=params, timeout=10)
            data     = response.json()

            jobs = []
            for job in data.get("jobs_results", []):
                apply_options = job.get("apply_options", [])
                apply_link    = apply_options[0].get("link") if apply_options else None
                if not apply_link:
                    apply_link = job.get("link")
                if not apply_link:
                    continue

                jobs.append({
                    "title":       job.get("title"),
                    "company":     job.get("company_name"),
                    "location":    job.get("location"),
                    "description": job.get("description") or job.get("snippet", ""),
                    "url":         apply_link,
                    "apply_url":   apply_link,
                    "platform":    job.get("via", "Unknown"),
                    "is_real_job": True,
                })

                if len(jobs) >= count:
                    break

            return jobs

        except Exception as e:
            print("SerpAPI error:", e)
            return []