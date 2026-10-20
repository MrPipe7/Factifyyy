# Backend Structure

This project uses a serverless backend on Vercel.

- `api/`: HTTP entrypoints (serverless handlers).
- `backend/services/`: reusable backend business logic.
- `shared/`: cross-layer types and analyzers shared with frontend.

Current extraction completed:

- External fact-check orchestration moved to `backend/services/factCheckService.ts`.
- URL extraction logic moved to `backend/services/analyzeUrlService.ts`.
- Feedback persistence logic moved to `backend/services/feedbackService.ts`.
- Endpoints in `api/` now consume backend services instead of embedding business logic.

This keeps deployment compatibility with Vercel while making backend code easier to locate and scale.
