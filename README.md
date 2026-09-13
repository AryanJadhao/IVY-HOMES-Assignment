# Ivy Homes Software Engineering Internship Assignment

## Architecture & Setup

### Prerequisites
- Node.js (v18+)
- Python (3.11+) for forensic scripts

### Running the Frontend Locally
1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. Open `http://localhost:3000`

The application uses **Next.js (App Router)** with **Tailwind CSS** and **Recharts**.

---

## Reverse-Engineering Methodology

Instead of blindly wiring a frontend to the API, I implemented a two-phase data forensic pipeline:

1. **Phase 1: Dump & Probe**
   I wrote a robust Python scraper (`dump_data.py`) to systematically extract the entirety of the database locally. During extraction, I continuously audited for standard discrepancies (e.g., verifying if filters threw 400 errors or were silently ignored, testing `page` vs `offset`). 
   - I discovered early on that `X-API-Key` headers were required (despite documentation) and the pagination mechanism was entirely undocumented (`offset`).

2. **Phase 2: Offline Analysis**
   Once the dataset (~6.5K combined records) was safely downloaded to local JSON files, I used `pandas` to query the anomalies without hitting rate limits. By plotting statistical distributions for `carpet_area` and `price`, the severe unit inconsistencies (such as Square Meters acting as Square Feet) emerged visibly.

3. **Phase 3: Robust UI Compensation**
   I designed the React frontend to actively compensate for the server's lies. It normalizes unit data dynamically on render, paginates using `offset`, and implements full client-side filtering because the server silently ignores filter query params.

---

## Negative Hypotheses

During the forensic phase, I tested several potential "lies" that turned out to be completely fine:

*   **Hypothesis: Annual vs. Monthly Rent** 
    *   *Test:* Are rental prices secretly annualized? 
    *   *Result:* Tested across 1,700 records; rental prices perfectly matched the expected market monthly values for Bangalore (min ₹7,500, average ₹35,000, max ₹91,000). Status: Verified Fine.
*   **Hypothesis: Fake Coordinate Bounding** 
    *   *Test:* Are properties randomly dispersed globally? 
    *   *Result:* Almost all coordinates correctly clustered around Bangalore bounds (~12.9 N, 77.5 E). Only a tiny handful (6 listings) were severely corrupted. Status: Verified Fine.
*   **Hypothesis: Missing `description` text in rentals vs listings**
    *   *Test:* Do some endpoints omit large text blobs?
    *   *Result:* Both listings and rentals consistently populate their payload descriptions without random truncation. Status: Verified Fine.

---

## Future Roadmap

If given 2 extra days, I would build:
1. **Automated Anomaly Detection Pipeline:** A Node.js middleware layer connecting the real API to the frontend that acts as an "anti-corruption layer". It would use statistical Z-scores to automatically detect and cast incorrect units (like SqM to SqFt) before it even hits the React state.
2. **ML-Based Scam Detector:** Instead of static heuristic rules (like counting duplicated phone numbers across multiple names), we could parse the actual `description` text embeddings to group properties that are copy-pasted across different agents to identify "ghost listings".
3. **Advanced Offline Support:** Syncing the `/v1/favourites` (which is currently a 404) to an IndexedDB store instead of LocalStorage to allow for richer offline search queries and saved filters.
