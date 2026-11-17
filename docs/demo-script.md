# KPilot: 3-minute demo script

Lines that start with `>` are the words to say out loud. Everything else is for you.
The script is about 320 spoken words. The rest of the three minutes is clicking and waiting.

## Before you record

- [ ] Backend running (`uvicorn app.main:app --reload --port 8000`) and frontend running (`npm run dev`)
- [ ] Do one full practice run first, including **Generate review**, so you know it works and how long Gemini takes today
- [ ] Browser at 100% zoom, one tab only, bookmarks bar hidden (Ctrl+Shift+B), window at 1280x720 or full screen
- [ ] Notifications off (Windows: Do not disturb), microphone checked
- [ ] Reload http://localhost:5173 so the page is at the top and no data is loaded
- [ ] Recording tool ready: on Windows, press **Win+G** to open the Xbox Game Bar, then **Win+Alt+R** starts and stops recording of the browser. OBS Studio or Loom also work
- [ ] If your dashboard percentages differ from the ones described below, change the wording to match what is on screen

## 0:00 to 0:20 | The problem

**On screen:** the top of the page: header, headline and the product preview. Stay still, do not scroll.

> Every Monday, someone copies numbers from a spreadsheet into slides and writes the same summary again. This is KPilot, the AI copilot for your weekly KPIs. It does that routine for you: numbers against target, then a review you can send.

## 0:20 to 0:45 | One-click demo

**On screen:** click **Try the live demo**. The page scrolls to the upload card, shows the spinner, then the **Loaded** line (96 rows, 3 brands, 8 weeks), then scrolls to the dashboard.

> I'll click Try the live demo. It loads a sample CSV, three brands, eight weeks, four metrics each, sends it through the upload check, and computes the summary. If a file is wrong, KPilot names the exact line. This sample data is synthetic.

## 0:45 to 1:30 | The dashboard

**On screen:** the brand cards. Point at a red badge on VSH7 Technologies (revenue), then the SharmaJEE conversion rate. Scroll to the **Actual vs target** chart, switch **Brand** and **Metric** once, and hover a point so the tooltip shows.

> Here's the latest week. Every metric has a red, amber or green status, with a text label too, so it never relies on colour alone, plus the change since last week. VSH7's revenue is well under target. SharmaJEE gets more leads every week, but its conversion rate keeps falling. The chart shows actual against target, and I can switch brand and metric. Hovering gives the exact numbers.

## 1:30 to 2:15 | The AI review

**On screen:** scroll to **AI review** and click **Generate review**. While it loads, keep talking (the second and third sentences below are written to cover the wait). When it appears, move the mouse over the headline, then a risk, then the follow-up table. Change one deadline with the date picker.

> Now the part that saves the time. Generate review. Only the computed numbers go to Gemini, never the raw rows. Code does the arithmetic; the model writes the words, in a strict format the backend validates. Here's the headline, the risks, ranked, and follow-ups, each with an owner role, a deadline and a priority. Owners are roles like Sales lead, never invented names. Everything is editable, so I'll change this deadline. I still read it before sending, because the wording isn't fact-checked.

If Gemini takes longer than about ten seconds, keep talking about the design (code does the arithmetic, strict format), and cut the dead air when you edit the video.

## 2:15 to 2:35 | The PDF

**On screen:** click **Export PDF**. The confirmation appears. Open the downloaded file from the browser's download bar and scroll through the overview page and one brand page.

> Export PDF gives an overview page with the headline and status counts, then one page per brand with its KPI table, risks and my edited follow-ups.

## 2:35 to 3:00 | Under the hood and close

**On screen:** switch to the GitHub repository page if it is up (the README with the architecture diagram), otherwise scroll back to the top of the KPilot page.

> Under the hood it's FastAPI and Pandas, Pydantic validation, Gemini through the Google GenAI SDK, ReportLab for the PDF, and React with Tailwind and Recharts on the front. It's accessible, the RAG logic has unit tests, and the README lists the limitations honestly. I'm Harshita, and the code is on GitHub. Thanks for watching.

## If you go over time

Cut, in this order: the sentence about hovering the chart, the second chart-switch, then the line about owners being roles.

## Likely questions, with short answers

**Why not let Gemini do the numbers?**
Percent of target, week-over-week change and RAG status are computed with Pandas, so they are deterministic and testable. The model only writes the narrative on top of numbers it is given.

**How do you stop the model making things up?**
The prompt forbids invented figures, causes and names. The reply must match a Pydantic schema. The backend also checks what a schema cannot: one summary per brand, no unknown brands, a follow-up for every brand with an amber or red metric, and deadlines in the right week. If a check fails it retries once with the reason. The honest limit: a number quoted inside a sentence is not compared with the source, so a person should read the review.

**What happens when Gemini is slow or down?**
Timeouts and server errors are retried with a short delay, each call has a 60-second limit, and a final failure becomes a readable 502 message. The interface keeps any review already on screen and lets the user try again.

**Did anything go wrong with the model during the build?**
Yes: the default model, `gemini-2.5-flash`, returned "not found" for my account, and the newest models timed out. The model name is a setting in `.env`, so I tested a few and switched to `gemini-3.5-flash` without touching the code.

**Why is the backend stateless?**
The browser holds the uploaded rows and sends them with each request, so there is no database to run and a restart loses nothing. The trade-off is that nothing is saved between sessions, which is listed under limitations.

**What did you do for accessibility?**
A skip link, text labels on every status badge so colour is never the only signal, a hidden data table behind the chart for screen readers, live-region announcements for loading and downloads, visible focus rings, and reduced-motion support.

**What would you build next?**
Per-metric direction (lower is better for things like churn), editable thresholds, saved reviews to compare week to week, and sign-in with team workspaces.
