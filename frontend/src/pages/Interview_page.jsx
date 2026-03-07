import { useState } from "react";
import {
  generateInterviewQuestions,
  generateCodingQuestion,
  generateSystemDesignQuestion,
  startMockInterview,
  evaluateAnswer,
} from "../services/api";

const TABS = [
  { key: "questions", label: "Interview Questions", icon: "🧠" },
  { key: "cs",        label: "CS Fundamentals",     icon: "📚" },
  { key: "coding",    label: "Coding Round",        icon: "💻" },
  { key: "system",    label: "System Design",       icon: "🏗️" },
  { key: "mock",      label: "Mock Interview",      icon: "🎤" },
];

// ─── CS Fundamentals Question Bank ───────────────────────
const CS_TOPICS = [
  {
    key: "dsa",
    label: "DSA",
    icon: "🌲",
    color: "indigo",
    questions: [
      { q: "What is the difference between an array and a linked list?", a: "Arrays store elements in contiguous memory with O(1) random access but O(n) insertion/deletion. Linked lists store nodes with pointers — O(1) insertion/deletion at head but O(n) access. Arrays are better for index-based access; linked lists for frequent inserts/deletes." },
      { q: "Explain time and space complexity. What is Big O notation?", a: "Big O describes the worst-case growth rate of an algorithm as input size (n) grows. Time complexity measures operations count; space complexity measures memory usage. Common complexities: O(1) constant, O(log n) logarithmic, O(n) linear, O(n²) quadratic." },
      { q: "What is a hash table and how does it handle collisions?", a: "A hash table maps keys to values using a hash function. Collisions (two keys mapping to the same index) are handled via: (1) Chaining — store a linked list at each slot, (2) Open addressing — probe for the next empty slot (linear/quadratic probing)." },
      { q: "Difference between BFS and DFS? When would you use each?", a: "BFS explores level by level using a queue — best for shortest path in unweighted graphs. DFS explores depth-first using a stack/recursion — best for cycle detection, topological sort, and pathfinding in mazes." },
      { q: "What is a binary search tree (BST)? What are its time complexities?", a: "A BST is a tree where every left child < parent < right child. Average case: O(log n) for search, insert, delete. Worst case (skewed tree): O(n). Self-balancing BSTs like AVL or Red-Black trees guarantee O(log n)." },
      { q: "Explain dynamic programming. How is it different from recursion?", a: "DP solves problems by breaking them into overlapping subproblems and storing results (memoization or tabulation) to avoid recomputation. Recursion recomputes the same subproblems. DP trades space for time — classic examples: Fibonacci, 0/1 Knapsack, LCS." },
      { q: "What is a heap? Difference between min-heap and max-heap?", a: "A heap is a complete binary tree where each parent satisfies a heap property. Min-heap: parent ≤ children (root is minimum). Max-heap: parent ≥ children (root is maximum). Used in priority queues and heap sort. Insert/delete: O(log n)." },
      { q: "What is the difference between a stack and a queue?", a: "Stack: LIFO (Last In First Out) — push/pop from the same end. Used in function call stack, undo operations, DFS. Queue: FIFO (First In First Out) — enqueue at back, dequeue from front. Used in BFS, task scheduling, print queues." },
    ]
  },
  {
    key: "os",
    label: "Operating Systems",
    icon: "🖥️",
    color: "violet",
    questions: [
      { q: "What is a process vs a thread?", a: "A process is an independent program with its own memory space. A thread is a lightweight unit of execution within a process, sharing its memory. Processes are isolated (crash doesn't affect others); threads are faster to create and communicate but can cause race conditions." },
      { q: "What is a deadlock? What are the four conditions for it?", a: "Deadlock: two or more processes wait for each other's resources indefinitely. Four Coffman conditions: (1) Mutual exclusion, (2) Hold and wait, (3) No preemption, (4) Circular wait. Breaking any one condition prevents deadlock." },
      { q: "Explain virtual memory and paging.", a: "Virtual memory lets processes use more memory than physically available by storing pages on disk. Paging divides memory into fixed-size pages. The MMU maps virtual addresses to physical frames via a page table. Page faults occur when a page isn't in RAM and must be loaded from disk." },
      { q: "What is the difference between mutex and semaphore?", a: "Mutex (mutual exclusion): a lock owned by one thread at a time — only the owner can unlock it. Semaphore: a counter allowing N threads to access a resource simultaneously. Binary semaphore ≈ mutex, but any thread can signal it. Use mutex for ownership; semaphore for signaling." },
      { q: "What are the CPU scheduling algorithms?", a: "FCFS (First Come First Served) — simple but poor average wait. SJF (Shortest Job First) — optimal average wait but requires knowing burst time. Round Robin — fixed time quantum, fair for interactive systems. Priority Scheduling — higher priority runs first, risk of starvation. MLFQ combines multiple queues." },
      { q: "What is thrashing in an operating system?", a: "Thrashing occurs when a system spends more time swapping pages in/out of memory than executing processes. Caused by too many processes competing for limited RAM. Solution: reduce degree of multiprogramming, use working set model to track active pages." },
    ]
  },
  {
    key: "dbms",
    label: "DBMS",
    icon: "🗄️",
    color: "cyan",
    questions: [
      { q: "What are ACID properties in databases?", a: "Atomicity: transaction completes fully or not at all. Consistency: database moves from one valid state to another. Isolation: concurrent transactions don't interfere. Durability: committed transactions survive system failures. These ensure reliable transaction processing." },
      { q: "What is database normalization? Explain 1NF, 2NF, 3NF.", a: "Normalization organizes data to reduce redundancy. 1NF: atomic values, no repeating groups. 2NF: 1NF + no partial dependency on composite key. 3NF: 2NF + no transitive dependency (non-key column depends only on primary key). BCNF is a stricter version of 3NF." },
      { q: "Difference between SQL JOIN types?", a: "INNER JOIN: rows matching in both tables. LEFT JOIN: all left table rows + matched right rows (NULL if no match). RIGHT JOIN: opposite of LEFT. FULL OUTER JOIN: all rows from both, NULLs where no match. CROSS JOIN: cartesian product of both tables." },
      { q: "What is indexing? When should you use it?", a: "An index is a data structure (usually B-tree) that speeds up data retrieval at the cost of write speed and storage. Use indexes on columns frequently used in WHERE, JOIN, ORDER BY. Avoid over-indexing — each index slows INSERT/UPDATE/DELETE operations." },
      { q: "What is the difference between SQL and NoSQL databases?", a: "SQL: structured, table-based, schema-enforced, supports ACID, great for complex queries and relationships (MySQL, PostgreSQL). NoSQL: flexible schema, document/key-value/graph/columnar stores, horizontally scalable, eventual consistency (MongoDB, Redis, Cassandra). Choose based on data structure and scale needs." },
      { q: "What are transactions? Explain commit and rollback.", a: "A transaction is a sequence of database operations treated as a single unit. COMMIT permanently saves changes. ROLLBACK undoes all changes in the current transaction. Used to maintain data integrity — if any step fails, rollback ensures the database isn't left in a partial state." },
    ]
  },
  {
    key: "networking",
    label: "Networking",
    icon: "🌐",
    color: "green",
    questions: [
      { q: "What happens when you type a URL in the browser and press Enter?", a: "1. DNS lookup resolves domain to IP. 2. TCP connection established (3-way handshake). 3. TLS handshake for HTTPS. 4. Browser sends HTTP GET request. 5. Server processes and returns HTTP response. 6. Browser parses HTML, fetches assets, renders page." },
      { q: "What is the difference between TCP and UDP?", a: "TCP: connection-oriented, reliable, ordered delivery, flow control, slower. Used for HTTP, email, file transfer. UDP: connectionless, no guarantee of delivery/order, faster, lower overhead. Used for video streaming, DNS, gaming, VoIP where speed > reliability." },
      { q: "What is HTTP vs HTTPS? What does SSL/TLS do?", a: "HTTP transfers data in plaintext — vulnerable to interception. HTTPS adds SSL/TLS encryption — data is encrypted in transit, server identity is verified via certificates. TLS performs a handshake to establish a shared secret key, then encrypts all communication with it." },
      { q: "What are REST API principles?", a: "REST (Representational State Transfer): (1) Stateless — each request contains all needed info. (2) Client-server separation. (3) Uniform interface — standard HTTP methods (GET, POST, PUT, DELETE). (4) Resource-based URLs. (5) Cacheable responses. (6) Layered system." },
      { q: "What is the OSI model?", a: "7 layers: Physical (cables/bits), Data Link (MAC, frames), Network (IP, routing), Transport (TCP/UDP, ports), Session (connection management), Presentation (encryption, encoding), Application (HTTP, DNS, FTP). Helps troubleshoot — 'Can't reach server?' — check each layer bottom up." },
    ]
  },
  {
    key: "oop",
    label: "OOP",
    icon: "🧩",
    color: "orange",
    questions: [
      { q: "What are the four pillars of OOP?", a: "Encapsulation: bundling data + methods, hiding internal state. Abstraction: exposing only necessary details. Inheritance: child class inherits properties/methods from parent. Polymorphism: same interface, different implementations (method overloading = compile-time, overriding = runtime)." },
      { q: "What is the difference between abstraction and encapsulation?", a: "Encapsulation is about hiding implementation details (using private fields, public methods). Abstraction is about hiding complexity by showing only relevant features (interfaces, abstract classes). Encapsulation is 'how it works is hidden'; abstraction is 'what it does is shown'." },
      { q: "What is method overloading vs method overriding?", a: "Overloading: same method name, different parameters, resolved at compile time (static polymorphism). Overriding: child class redefines parent's method with same signature, resolved at runtime (dynamic polymorphism). Overriding requires inheritance; overloading doesn't." },
      { q: "What are SOLID principles?", a: "S: Single Responsibility — one class, one job. O: Open/Closed — open for extension, closed for modification. L: Liskov Substitution — subtypes must be substitutable for base types. I: Interface Segregation — many specific interfaces > one general. D: Dependency Inversion — depend on abstractions, not concretions." },
      { q: "What is the difference between an interface and an abstract class?", a: "Abstract class: can have implemented methods, constructors, state. Single inheritance. Interface: only method signatures (pre-Java 8), no state. Multiple implementation. Use abstract class when sharing code among related classes; use interface to define a contract for unrelated classes." },
      { q: "What is a design pattern? Name a few common ones.", a: "Design patterns are reusable solutions to common software problems. Creational: Singleton (one instance), Factory (object creation without specifying class). Structural: Adapter (interface compatibility), Decorator (add behavior dynamically). Behavioral: Observer (event system), Strategy (swap algorithms at runtime)." },
    ]
  },
];

export default function InterviewPage() {
  const savedScan = (() => {
    try { return JSON.parse(sessionStorage.getItem("scanResult")); }
    catch { return null; }
  })();

  const [activeTab, setActiveTab] = useState("questions");
  const [jobTitle, setJobTitle]   = useState(savedScan?.job_title ?? "");
  const skills                    = savedScan?.skills ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-indigo-400 text-sm font-medium mb-1">AI-Powered</p>
          <h1 className="text-3xl font-bold">Interview Preparation</h1>
          <p className="mt-2 text-slate-300">
            Practice real questions, get instant AI feedback, and ace your next interview.
          </p>
          <div className="mt-6 flex gap-3 max-w-md">
            <input
              type="text"
              placeholder="Enter job title (e.g. React Developer)"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          {savedScan?.job_title && (
            <p className="mt-2 text-xs text-indigo-300">✅ Pre-filled from your resume scan</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {activeTab === "questions" && <QuestionsTab jobTitle={jobTitle} skills={skills} />}
        {activeTab === "cs"        && <CSFundamentalsTab />}
        {activeTab === "coding"    && <CodingTab jobTitle={jobTitle} />}
        {activeTab === "system"    && <SystemDesignTab jobTitle={jobTitle} />}
        {activeTab === "mock"      && <MockInterviewTab jobTitle={jobTitle} />}
      </div>
    </div>
  );
}

// ─── Questions Tab ────────────────────────────────────────

function QuestionsTab({ jobTitle, skills }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [count, setCount]         = useState(5);

  async function fetchQuestions() {
    if (!jobTitle.trim()) return;
    setLoading(true); setError(null); setQuestions([]);
    try {
      const res = await generateInterviewQuestions({ title: jobTitle, skills, num_questions: count });
      const list = Array.isArray(res) ? res : (res.questions ?? []);
      setQuestions(list);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n} questions</option>)}
        </select>
        <GenerateButton onClick={fetchQuestions} loading={loading} disabled={!jobTitle.trim()} label="Generate Questions" />
      </div>
      <RequireTitle show={!jobTitle.trim()} />
      <ErrorBox error={error} />
      {loading && <SkeletonList count={count} />}
      {questions.length > 0 && (
        <div className="space-y-4">
          {questions.map((q, i) => <QuestionCard key={i} index={i + 1} question={q} />)}
        </div>
      )}
    </div>
  );
}

// ─── Coding Tab ───────────────────────────────────────────

function CodingTab({ jobTitle }) {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  async function fetchQuestion() {
    if (!jobTitle.trim()) return;
    setLoading(true); setError(null); setQuestion(null);
    try { setQuestion(await generateCodingQuestion(jobTitle)); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <GenerateButton onClick={fetchQuestion} loading={loading} disabled={!jobTitle.trim()} label="Generate Coding Question" />
      <RequireTitle show={!jobTitle.trim()} />
      <ErrorBox error={error} />
      {loading && <SkeletonCard />}
      {question && <RichCard data={question} />}
    </div>
  );
}

// ─── System Design Tab ────────────────────────────────────

function SystemDesignTab({ jobTitle }) {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  async function fetchQuestion() {
    if (!jobTitle.trim()) return;
    setLoading(true); setError(null); setQuestion(null);
    try { setQuestion(await generateSystemDesignQuestion(jobTitle)); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <GenerateButton onClick={fetchQuestion} loading={loading} disabled={!jobTitle.trim()} label="Generate System Design Question" />
      <RequireTitle show={!jobTitle.trim()} />
      <ErrorBox error={error} />
      {loading && <SkeletonCard />}
      {question && <RichCard data={question} />}
    </div>
  );
}

// ─── Mock Interview Tab ───────────────────────────────────

function MockInterviewTab({ jobTitle }) {
  const [session, setSession]         = useState(null);
  const [answer, setAnswer]           = useState("");
  const [feedback, setFeedback]       = useState(null);
  const [loading, setLoading]         = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);
  const [error, setError]             = useState(null);

  async function startSession() {
    if (!jobTitle.trim()) return;
    setLoading(true); setError(null); setSession(null); setFeedback(null); setAnswer("");
    try { setSession(await startMockInterview(jobTitle)); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function submitAnswer() {
    if (!answer.trim() || !session) return;
    setEvalLoading(true); setFeedback(null);
    try {
      const questionText =
        typeof session === "string" ? session
        : session.question ?? session.content ?? JSON.stringify(session);
      setFeedback(await evaluateAnswer(questionText, answer));
    } catch (err) { setError(err.message); }
    finally { setEvalLoading(false); }
  }

  const questionText = session
    ? (typeof session === "string" ? session : session.question ?? session.content ?? JSON.stringify(session))
    : "";

  return (
    <div className="space-y-6">
      {/* Start screen */}
      {!session && !loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">🎤</div>
          <h3 className="font-semibold text-slate-800 text-xl mb-2">Mock Interview Session</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Get a real interview question, write your answer, and receive instant AI evaluation on clarity, depth, and relevance.
          </p>
          <GenerateButton onClick={startSession} loading={loading} disabled={!jobTitle.trim()} label="Start Mock Interview" />
        </div>
      )}

      <RequireTitle show={!jobTitle.trim()} />
      <ErrorBox error={error} />
      {loading && <SkeletonCard />}

      {/* Active session — answering */}
      {session && !feedback && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
              Interview Question
            </span>
            <p className="text-slate-800 text-lg font-medium leading-relaxed">{questionText}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">Your Answer</label>
            <textarea
              rows={6}
              placeholder="Type your answer here... Be specific and use examples from your experience."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-slate-400">{answer.length} characters</span>
              <button
                onClick={submitAnswer}
                disabled={evalLoading || !answer.trim()}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {evalLoading ? (
                  <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Evaluating...</>
                ) : "Submit Answer →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-slate-500 mb-1">Question</p>
            <p className="text-slate-700 text-sm">{questionText}</p>
          </div>

          <FeedbackCard feedback={feedback} />

          <div className="flex gap-3">
            <button
              onClick={startSession}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
            >
              Next Question →
            </button>
            <button
              onClick={() => { setSession(null); setFeedback(null); setAnswer(""); }}
              className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition"
            >
              End Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CS Fundamentals Tab ─────────────────────────────────

function CSFundamentalsTab() {
  const [activeTopic, setActiveTopic] = useState("dsa");
  const [openIdx, setOpenIdx]         = useState(null);
  const [notes, setNotes]             = useState({});
  const [saved, setSaved]             = useState({});

  const topic = CS_TOPICS.find((t) => t.key === activeTopic);

  const colorMap = {
    indigo: { pill: "bg-indigo-600 text-white", inactive: "bg-indigo-50 text-indigo-700 border-indigo-200", badge: "bg-indigo-100 text-indigo-700", bar: "bg-indigo-500" },
    violet: { pill: "bg-violet-600 text-white", inactive: "bg-violet-50 text-violet-700 border-violet-200", badge: "bg-violet-100 text-violet-700", bar: "bg-violet-500" },
    cyan:   { pill: "bg-cyan-600 text-white",   inactive: "bg-cyan-50 text-cyan-700 border-cyan-200",       badge: "bg-cyan-100 text-cyan-700",   bar: "bg-cyan-500"   },
    green:  { pill: "bg-emerald-600 text-white", inactive: "bg-emerald-50 text-emerald-700 border-emerald-200", badge: "bg-emerald-100 text-emerald-700", bar: "bg-emerald-500" },
    orange: { pill: "bg-orange-500 text-white", inactive: "bg-orange-50 text-orange-700 border-orange-200", badge: "bg-orange-100 text-orange-700", bar: "bg-orange-500" },
  };

  const c = colorMap[topic.color];
  const noteKey = (i) => `${activeTopic}-${i}`;

  return (
    <div className="space-y-6">
      {/* Topic pills */}
      <div className="flex flex-wrap gap-2">
        {CS_TOPICS.map((t) => {
          const tc = colorMap[t.color];
          const isActive = activeTopic === t.key;
          return (
            <button
              key={t.key}
              onClick={() => { setActiveTopic(t.key); setOpenIdx(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                isActive ? tc.pill + " border-transparent shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {/* Topic header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.badge}`}>
            {topic.questions.length} questions
          </span>
          <span className="text-slate-500 text-sm">{topic.label}</span>
        </div>
        <button
          onClick={() => setOpenIdx(null)}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Collapse all
        </button>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {topic.questions.map((item, i) => {
          const isOpen = openIdx === i;
          const nk     = noteKey(i);
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              {/* Question row */}
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="w-full flex items-start gap-4 p-5 text-left hover:bg-slate-50 transition"
              >
                <span className={`flex-shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${c.badge}`}>
                  {i + 1}
                </span>
                <p className="flex-1 text-slate-800 font-medium leading-snug text-sm">{item.q}</p>
                <span className="text-slate-400 shrink-0">{isOpen ? "▾" : "▸"}</span>
              </button>

              {/* Answer + notes */}
              {isOpen && (
                <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
                  {/* Answer */}
                  <div className={`rounded-xl p-4 ${c.badge.replace("text-", "border-").replace("bg-", "bg-")} border`} style={{background: ""}}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">💡 Answer</p>
                    <p className="text-slate-700 text-sm leading-relaxed">{item.a}</p>
                  </div>

                  {/* Notes */}
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">📝 Your Notes</p>
                    <textarea
                      rows={2}
                      placeholder="Add your own notes or memory tricks..."
                      value={notes[nk] ?? ""}
                      onChange={(e) => { setNotes((p) => ({ ...p, [nk]: e.target.value })); setSaved((p) => ({ ...p, [nk]: false })); }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-emerald-600">{saved[nk] ? "✅ Saved" : ""}</span>
                      <button
                        onClick={() => setSaved((p) => ({ ...p, [nk]: true }))}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress tracker */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">📊 Topic Coverage</p>
        <div className="space-y-2">
          {CS_TOPICS.map((t) => {
            const tc = colorMap[t.color];
            return (
              <div key={t.key} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-32 shrink-0">{t.icon} {t.label}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${tc.bar} rounded-full`} style={{ width: "100%" }} />
                </div>
                <span className="text-xs text-slate-400 w-16 text-right">{t.questions.length} Qs</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Shared UI Components ─────────────────────────────────

function GenerateButton({ onClick, loading, disabled, label }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
    >
      {loading ? (
        <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Generating...</>
      ) : `✨ ${label}`}
    </button>
  );
}

function RequireTitle({ show }) {
  if (!show) return null;
  return <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">⚠️ Enter a job title above to generate questions.</div>;
}

function ErrorBox({ error }) {
  if (!error) return null;
  return <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">❌ {error}</div>;
}

// Handles any shape the backend returns — string or object
function RichCard({ data }) {
  if (typeof data === "string") {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{data}</pre>
      </div>
    );
  }
  // Render known keys nicely, fall back to raw JSON for unknown shapes
  const knownKeys = ["title", "question", "description", "requirements", "examples", "constraints", "hints"];
  const hasKnown  = knownKeys.some((k) => data[k]);

  if (!hasKnown) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
      {data.title       && <h3 className="font-bold text-slate-900 text-lg">{data.title}</h3>}
      {data.question    && <p className="text-slate-800 font-medium leading-relaxed">{data.question}</p>}
      {data.description && <p className="text-slate-700 text-sm leading-relaxed">{data.description}</p>}
      {data.requirements && (
        <Section label="Requirements" text={data.requirements} />
      )}
      {data.examples && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Examples</p>
          <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap overflow-x-auto font-mono">
            {typeof data.examples === "string" ? data.examples : JSON.stringify(data.examples, null, 2)}
          </pre>
        </div>
      )}
      {data.constraints && <Section label="Constraints" text={data.constraints} />}
      {data.hints       && <Section label="Hints" text={data.hints} muted />}
    </div>
  );
}

function Section({ label, text, muted }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm leading-relaxed ${muted ? "text-slate-400 italic" : "text-slate-600"}`}>{text}</p>
    </div>
  );
}

function FeedbackCard({ feedback }) {
  if (typeof feedback === "string") {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="font-semibold text-slate-800 mb-3">🤖 AI Feedback</h3>
        <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{feedback}</p>
      </div>
    );
  }
  const score      = feedback?.score ?? null;
  const scoreColor = score >= 8 ? "text-emerald-600" : score >= 5 ? "text-amber-500" : "text-red-500";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">🤖 AI Feedback</h3>
        {score !== null && (
          <span className={`text-2xl font-bold ${scoreColor}`}>
            {score}<span className="text-base text-slate-400">/10</span>
          </span>
        )}
      </div>
      {feedback.feedback    && <p className="text-slate-700 text-sm leading-relaxed">{feedback.feedback}</p>}
      {feedback.strengths   && <Section label="✅ Strengths"    text={feedback.strengths} />}
      {feedback.improvements && <Section label="⚡ Improvements" text={feedback.improvements} />}
      {/* Raw fallback for unexpected shapes */}
      {!feedback.feedback && !feedback.strengths && !feedback.score && (
        <pre className="text-sm text-slate-600 whitespace-pre-wrap">{JSON.stringify(feedback, null, 2)}</pre>
      )}
    </div>
  );
}

function QuestionCard({ index, question }) {
  const [open, setOpen]   = useState(false);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const text       = typeof question === "string" ? question : (question.question ?? JSON.stringify(question));
  const type       = question?.type ?? null;
  const difficulty = question?.difficulty ?? null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-slate-50 transition"
      >
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center">
          {index}
        </span>
        <div className="flex-1">
          <p className="text-slate-800 font-medium leading-snug">{text}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {type       && <Badge label={type}       color="indigo" />}
            {difficulty && <Badge label={difficulty} color={difficulty === "hard" ? "red" : difficulty === "medium" ? "amber" : "green"} />}
          </div>
        </div>
        <span className="text-slate-400 text-lg mt-1">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-3">
          <p className="text-xs font-medium text-slate-500">📝 Practice Notes</p>
          <textarea
            rows={3}
            placeholder="Write key points for your answer..."
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-emerald-600">{saved ? "✅ Saved" : ""}</span>
            <button onClick={() => setSaved(true)} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Save notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ label, color }) {
  const colors = { indigo: "bg-indigo-100 text-indigo-700", red: "bg-red-100 text-red-600", amber: "bg-amber-100 text-amber-700", green: "bg-emerald-100 text-emerald-700" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[color] ?? colors.indigo}`}>{label}</span>;
}

function SkeletonList({ count }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 animate-pulse flex gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse space-y-3">
      <div className="h-5 bg-slate-200 rounded w-1/2" />
      <div className="h-4 bg-slate-100 rounded w-full" />
      <div className="h-4 bg-slate-100 rounded w-5/6" />
      <div className="h-4 bg-slate-100 rounded w-4/6" />
    </div>
  );
}