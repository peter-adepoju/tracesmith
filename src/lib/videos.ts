/**
 * Verified video library.
 *
 * Every entry here was found on YouTube and then confirmed through the public
 * oEmbed endpoint, which returns the canonical title and channel only for
 * videos that actually exist. Lessons reference these by key, never by a raw
 * id, so a dead video is fixed in one place.
 *
 * Re-check the whole list with:
 *     python -I scripts/find-videos.py "<topic>"
 */

export type Video = {
  /** YouTube id. */
  id: string;
  title: string;
  channel: string;
  /** Runtime as shown on YouTube. */
  length: string;
  /** Why this one was chosen over the alternatives. */
  why: string;
};

export const VIDEOS = {
  "url-journey": {
    id: "AlkDbnbv7dk",
    title: "What happens when you type a URL into your browser?",
    channel: "ByteByteGo",
    length: "5:20",
    why: "The clearest five-minute version of the whole journey, with good diagrams.",
  },
  "internet-basics": {
    id: "7_LPdttKXPc",
    title: "How the Internet Works in 5 Minutes",
    channel: "Aaron",
    length: "4:49",
    why: "Plain-language background if the physical side of the network is new to you.",
  },
  "http-requests": {
    id: "-Zea7GB2OwA",
    title: "What are HTTP requests?",
    channel: "Codecademy",
    length: "4:56",
    why: "Short and precise on the request-response cycle, from a teaching company.",
  },
  "request-response-cycle": {
    id: "eesqK59rhGA",
    title: "The Http and the Web | Http Explained | Request-Response Cycle",
    channel: "The TechCave",
    length: "8:55",
    why: "A longer walk through the same cycle if the short version went too fast.",
  },
  "http-crash-course": {
    id: "iYM2zFP3Zn0",
    title: "HTTP Crash Course & Exploration",
    channel: "Traversy Media",
    length: "38:30",
    why: "The deep version. Worth it once the basics have settled.",
  },
  "http-methods": {
    id: "tkfVQK6UxDI",
    title: "HTTP Request Methods | GET, POST, PUT, DELETE",
    channel: "Curious Code",
    length: "3:01",
    why: "Three minutes, one idea per method, no padding.",
  },
  "status-codes": {
    id: "qmpUfWN7hh4",
    title: "HTTP Status Codes Explained In 5 Minutes",
    channel: "ByteByteGo",
    length: "5:07",
    why: "Groups the codes into families, which is how you should remember them.",
  },
  "status-codes-long": {
    id: "wJa5CTIFj7U",
    title: "Learn HTTP Status Codes In 10 Minutes",
    channel: "Web Dev Simplified",
    length: "10:22",
    why: "More examples of each code, with real cases.",
  },
  "http-headers": {
    id: "76CcJ90Lz4U",
    title: "How to use headers in REST APIs? Different types of headers",
    channel: "sudoCODE",
    length: "8:36",
    why: "Focused on headers alone, including the ones you will meet in auth.",
  },
  "headers-cookies": {
    id: "DxeSGUM16_4",
    title: "HTTP Headers and Cookies",
    channel: "Zach Gollwitzer",
    length: "17:38",
    why: "Goes further into cookies and sessions, useful before the Application panel.",
  },
  "devtools-network": {
    id: "e1gAyQuIFQo",
    title: "Inspect Network Activity - Chrome DevTools 101",
    channel: "Chrome for Developers",
    length: "9:00",
    why: "Official, from the team that builds DevTools. The canonical Network tab tour.",
  },
  "devtools-intro": {
    id: "t1c5tNPpXjs",
    title: "Fun & powerful: Intro to Chrome DevTools",
    channel: "Chrome for Developers",
    length: "5:34",
    why: "Official quick tour of the panels.",
  },
  "devtools-crash": {
    id: "x4q86IjJFag",
    title: "Google Chrome Developer Tools Crash Course",
    channel: "Traversy Media",
    length: "51:20",
    why: "The full tour when you want every panel in depth.",
  },
  "devtools-network-deep": {
    id: "LBgfSwX4GDI",
    title: "Demystifying the Browser Networking Tab in Developer Tools",
    channel: "Hussein Nasser",
    length: "20:55",
    why: "Deeper reading of timings and connection detail.",
  },
  html: {
    id: "qz0aGYrrlhU",
    title: "HTML Tutorial for Beginners: HTML Crash Course",
    channel: "Programming with Mosh",
    length: "1:09:34",
    why: "The most-watched beginner HTML course, and it earns it.",
  },
  "html-w3schools": {
    id: "BzYMFd-lQL4",
    title: "Learn HTML for Beginners",
    channel: "w3schools.com",
    length: "47:18",
    why: "From the reference site you will keep open anyway.",
  },
  "html-attributes": {
    id: "zUCIsEDCIMU",
    title: "What are attributes and how do they work?",
    channel: "freeCodeCamp Concepts",
    length: "3:00",
    why: "Three minutes on the one piece of HTML grammar people skip past.",
  },
  "html-forms": {
    id: "fNcJuPIZ2WE",
    title: "Learn HTML Forms In 25 Minutes",
    channel: "Web Dev Simplified",
    length: "24:56",
    why: "Thorough on every input type and what a form actually submits. Forms are where most QA bugs live, so this one is worth the time.",
  },
  "html-forms-short": {
    id: "2O8pkybH6po",
    title: "Learn HTML forms in 8 minutes",
    channel: "Bro Code",
    length: "8:39",
    why: "The fast version if you only need the shape.",
  },
  "html-tables": {
    id: "iDA0kF5lrVk",
    title: "Learn HTML tables in 3 minutes",
    channel: "Bro Code",
    length: "3:58",
    why: "Tables are small and you will meet them in every admin screen you test.",
  },
  "semantic-html": {
    id: "YOsMJQfwqow",
    title: "HTML & CSS for Absolute Beginners: Semantic HTML",
    channel: "Kevin Powell",
    length: "9:33",
    why: "Kevin Powell is the clearest teacher working in CSS and HTML. Worth following generally.",
  },
  "accessibility-intro": {
    id: "68h6bq1aYZo",
    title: "Web Accessibility Guidelines in About 7 Minutes",
    channel: "GoDaddy Developer",
    length: "7:22",
    why: "Enough to run your first accessibility pass today.",
  },
  "accessibility-full": {
    id: "2oiBKSjOOFE",
    title: "The Only Accessibility Video You Will Ever Need",
    channel: "Web Dev Simplified",
    length: "37:33",
    why: "The deep version, for when accessibility findings become part of your regular reports.",
  },
  css: {
    id: "wRNinF7YQqQ",
    title: "Learn CSS in 1 hour",
    channel: "Bro Code",
    length: "1:00:00",
    why: "One hour, practical, covers the box model and flexbox properly.",
  },
  "css-specificity": {
    id: "c0kfcP_nD9E",
    title: "CSS Specificity explained",
    channel: "Kevin Powell",
    length: "13:27",
    why: "Specificity is where CSS stops being obvious. Kevin Powell is the clearest explainer of it.",
  },
  "css-box-model": {
    id: "rIO5326FgPE",
    title: "Learn CSS Box Model In 8 Minutes",
    channel: "Web Dev Simplified",
    length: "8:22",
    why: "The box model explains most 'why is this the wrong size' bugs. Eight minutes well spent.",
  },
  flexbox: {
    id: "phWxA89Dy94",
    title: "Learn Flexbox CSS in 8 minutes",
    channel: "Slaying The Dragon",
    length: "8:16",
    why: "Enough flexbox to read almost any modern layout.",
  },
  "flexbox-deep": {
    id: "u044iM9xsWU",
    title: "Learn flexbox the easy way",
    channel: "Kevin Powell",
    length: "34:04",
    why: "The longer, better version once the basics have landed.",
  },
  dom: {
    id: "KShnPYN-voI",
    title: "The DOM in 4 minutes",
    channel: "Aaron Jack",
    length: "3:51",
    why: "Short and correct about what the DOM actually is.",
  },
  "html-vs-dom": {
    id: "J-02VNxE7lE",
    title: "HTML vs DOM? Let's debug them",
    channel: "Chrome for Developers",
    length: "5:12",
    why: "Official, and precisely the distinction that matters to a tester: what you wrote versus what the browser built.",
  },
  "media-queries": {
    id: "yU7jJ3NbPdA",
    title: "Learn CSS Media Query In 7 Minutes",
    channel: "Web Dev Simplified",
    length: "7:11",
    why: "The mechanism behind every responsive layout, in seven minutes.",
  },
  "responsive-practical": {
    id: "x4u1yp3Msao",
    title: "A practical guide to responsive web design",
    channel: "Kevin Powell",
    length: "23:13",
    why: "How responsive design is actually done, rather than the theory of it.",
  },
  "devtools-console": {
    id: "H0XScE08hy8",
    title: "Debugging JavaScript - Chrome DevTools 101",
    channel: "Chrome for Developers",
    length: "7:28",
    why: "Official. Covers the console and breakpoints together.",
  },
  "devtools-storage": {
    id: "5o8krh_Qduk",
    title: "localStorage and sessionStorage",
    channel: "Chrome for Developers",
    length: "3:21",
    why: "Official, and three minutes on where a login token actually lives.",
  },
  "devtools-tricks": {
    id: "pw14NzfYPa8",
    title: "14 DevTools Tricks That'll Make You a Better Developer",
    channel: "camelCase",
    length: "10:32",
    why: "Watch once you know the panels. Several of these will save you real time.",
  },
  json: {
    id: "cj3h3Fb10QY",
    title: "What is JSON? (Explained in 5 minutes)",
    channel: "Hostinger Academy",
    length: "5:44",
    why: "Enough to read a response. The syntax is genuinely small.",
  },
  "json-full": {
    id: "GpOO5iKzOmY",
    title: "Learn JSON - Full Crash Course for Beginners",
    channel: "freeCodeCamp.org",
    length: "11:44",
    why: "Covers nesting and arrays in more depth.",
  },
  "api-postman": {
    id: "-0MmWEYR2a8",
    title: "What is an API? (explained in 3 minutes)",
    channel: "Postman",
    length: "3:18",
    why: "From the company whose tool you will use all course. Three minutes.",
  },
  "api-intro": {
    id: "ByGJQzlzxQg",
    title: "What is an API (in 5 minutes)",
    channel: "Aaron Jack",
    length: "4:56",
    why: "A second angle on the same idea, which helps it stick.",
  },
  "rest-api": {
    id: "lsMQRaeKNDk",
    title: "What is a REST API?",
    channel: "IBM Technology",
    length: "9:12",
    why: "Careful and precise about what REST actually requires.",
  },
  "rest-api-short": {
    id: "-mN3VyJuCjM",
    title: "What Is REST API? Examples And How To Use It",
    channel: "ByteByteGo",
    length: "5:21",
    why: "Fast visual summary of REST conventions.",
  },
  "api-keys": {
    id: "xoriGNUNF7E",
    title: "What Is an API Key? (and How to Keep Them Safe)",
    channel: "Postman",
    length: "2:10",
    why: "Official and blunt about key safety, which is the part that matters.",
  },
  "api-auth": {
    id: "GcVtElYa17s",
    title: "API Authentication EXPLAINED! OAuth vs JWT vs API Keys",
    channel: "SoftsWeb",
    length: "9:42",
    why: "Compares the three methods side by side.",
  },
  "access-tokens": {
    id: "DanUVSlOSQQ",
    title: "API access tokens: how do they work",
    channel: "Dave Hollingworth",
    length: "2:18",
    why: "Two minutes on tokens versus keys.",
  },
  postman: {
    id: "CLG0ha_a0q8",
    title: "Postman API Testing Tutorial for Beginners",
    channel: "Code Bless You",
    length: "8:30",
    why: "Gets you sending real requests fastest.",
  },
  "postman-full": {
    id: "VywxIQ2ZXw4",
    title: "Postman Beginner's Course - API Testing",
    channel: "freeCodeCamp.org",
    length: "2:09:38",
    why: "The full course, for the week you want collections and scripting.",
  },
  webhooks: {
    id: "x_jjhcDrISk",
    title: "Top 3 Things You Should Know About Webhooks!",
    channel: "ByteByteGo",
    length: "3:55",
    why: "Short, and covers the retry and verification points most videos skip.",
  },
  "webhooks-vs-api": {
    id: "K7Fl9EJ92cg",
    title: "APIs vs Webhooks",
    channel: "Rokt mParticle",
    length: "4:39",
    why: "Polling versus being told, which is the whole idea.",
  },
  sql: {
    id: "h0nxCDiD-zg",
    title: "SQL Tutorial for Beginners",
    channel: "Kevin Stratvert",
    length: "44:57",
    why: "Clear, slow and practical. Enough SQL for a tester in one sitting.",
  },
  "sql-what": {
    id: "27axs9dO7AE",
    title: "What is SQL? [in 4 minutes for beginners]",
    channel: "Danielle Thé",
    length: "4:26",
    why: "Four-minute orientation before the long one.",
  },
  "qa-100s": {
    id: "u6QfIXgjwGQ",
    title: "Software Testing Explained in 100 Seconds",
    channel: "Fireship",
    length: "2:16",
    why: "The fastest possible orientation to what testing is.",
  },
  "qa-intro": {
    id: "qQfFp_GORpY",
    title: "Software Testing Tutorial #1 - What is Software Testing",
    channel: "Software Testing Mentor",
    length: "10:58",
    why: "First episode of a solid, job-focused manual testing series.",
  },
  "test-cases": {
    id: "-dXGEqalsi8",
    title: "How to Write Test Cases in Manual Testing with Template",
    channel: "The Testing Academy",
    length: "11:50",
    why: "Shows a real template being filled in, which is what you need.",
  },
  "test-cases-short": {
    id: "BBmA5Qp6Ghk",
    title: "How to write a TEST CASE? Software Testing Tutorial",
    channel: "Guru99",
    length: "3:31",
    why: "Three-minute version of the same structure.",
  },
  "bug-report": {
    id: "Qqfbr2itLGM",
    title: "How To Write A Good Bug Report?",
    channel: "Software Testing by Daniel K",
    length: "23:54",
    why: "Walks through real reports and what makes each one actionable.",
  },
  "severity-priority": {
    id: "HW_tnUnUav8",
    title: "Severity and Priority in Software Testing",
    channel: "Software Testing Material",
    length: "4:54",
    why: "Five minutes on the distinction beginners most often get wrong.",
  },
  "severity-priority-long": {
    id: "xhNFH5FBbC0",
    title: "Severity Vs Priority | Difference between them With Examples",
    channel: "SoftwaretestingbyMKT",
    length: "12:55",
    why: "More worked examples, and it is a common interview question.",
  },
  playwright: {
    id: "wGr5rz8WGCE",
    title: "What is Playwright? Playwright introduction tutorial",
    channel: "Testopic",
    length: "12:18",
    why: "Orientation before you install anything.",
  },
  "playwright-course": {
    id: "jydYq7oAtD8",
    title: "Software Testing Course - Playwright, E2E, and AI Agents",
    channel: "freeCodeCamp.org",
    length: "1:03:31",
    why: "A full modern automation course in one hour.",
  },
  n8n: {
    id: "Fy1UCBcgF2o",
    title: "n8n Tutorial for Beginners: How to Build AI Automations for FREE",
    channel: "Charlie Chang",
    length: "19:15",
    why: "Twenty minutes to your first working workflow.",
  },
  "n8n-course": {
    id: "UIf-SlmMays",
    title: "n8n Tutorial - Zero to Hero Course",
    channel: "freeCodeCamp.org",
    length: "3:35:08",
    why: "The full course for the automation phase.",
  },
  "ai-agents": {
    id: "FwOTs4UxQS4",
    title: "AI Agents, Clearly Explained",
    channel: "Jeff Su",
    length: "10:09",
    why: "Unusually honest about the line between a workflow and an agent.",
  },
  "ai-agents-ibm": {
    id: "F8NKVhkZZWI",
    title: "What are AI Agents?",
    channel: "IBM Technology",
    length: "12:29",
    why: "A more technical framing of the same distinction.",
  },
  git: {
    id: "RGOj5yH7evk",
    title: "Git and GitHub for Beginners - Crash Course",
    channel: "freeCodeCamp.org",
    length: "1:08:30",
    why: "The standard introduction, and you will need git in the final phase.",
  },
} as const satisfies Record<string, Video>;

export type VideoKey = keyof typeof VIDEOS;

export function getVideo(key: VideoKey): Video {
  return VIDEOS[key];
}
