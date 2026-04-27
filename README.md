# Placeko 

> AI-Powered Placement Assistant for Resume Analysis, Job Search, Interview Preparation, and Career Growth

AI-powered Placement Assistant for resume analysis, job search, interview preparation, application tracking, and cover letter generation.

Live Deployment
Frontend (Vercel)

https://ai-placement-assistant-32yb.vercel.app

Backend (Render)

https://ai-placement-assistant-9gvv.onrender.com

## Overview

Placeko helps students and job seekers streamline their placement and job application journey using AI-driven tools.

It combines:

* Resume Analysis with ATS scoring
* Resume keyword extraction
* AI feedback on resume quality
* Job Search and Job Matching
* Saved Jobs management
* Application Tracker
* Mock Interview Preparation
* Coding and System Design Interview Questions
* Cover Letter Generation
* Google OAuth + JWT Authentication

## Tech Stack

### Frontend

* React (Vite)
* React Router
* Tailwind CSS
* Context API
* Vercel Deployment

### Backend

* FastAPI
* Python
* MongoDB (Motor)
* JWT Authentication
* Google OAuth
* Render Deployment

### AI / NLP

* LangChain
* CrewAI
* Google Gemini
* spaCy
* PyPDFLoader
* Resume Parsing Agents

## Project Structure

```text
AI-placement-assistant/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── routes/
│   │   ├── agents/
│   │   ├── main.py
│   │   └── database.py
│   │
│   ├── requirements.txt
│   └── runtime.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
│
└── README.md
```

## Features

### Resume Analysis

* Upload PDF or TXT resume
* ATS score generation
* Keyword score
* Formatting score
* Impact score
* AI-generated improvement suggestions

### Job Search

* Search jobs by role and location
* Skill-based recommendations
* Resume-based job matching using RAG

### Interview Preparation

* HR interview questions
* Technical interview questions
* Coding rounds
* System design preparation
* Mock interview evaluation

### Application Tracker

* Track applied jobs
* Update application status
* Maintain notes and progress

### Cover Letter Generator

* Personalized cover letters
* Tone selection
* Job-description-based generation

## Installation

## Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Deployment

### Backend → Render

* Root Directory: `backend`
* Build Command: automatic via requirements.txt
* Start Command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Frontend → Vercel

* Root Directory: `frontend`
* Framework: Vite
* Add `vercel.json` for React Router rewrites

## Authentication Flow

1. User clicks Google Login
2. Backend redirects to Google OAuth
3. Google redirects to backend callback
4. Backend creates JWT token
5. Backend redirects to frontend `/auth/callback`
6. Frontend stores token in localStorage
7. Protected routes become accessible

## Future Improvements

* Role-based resume optimization
* LinkedIn profile analysis
* AI career roadmap generation
* Company-specific interview preparation
* Referral matching system
* Admin dashboard

## Author

Developed as an AI Placement Assistant project for improving student placement preparation and job application workflow.
