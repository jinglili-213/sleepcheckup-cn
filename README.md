# SleepCheckup.cn

Static Vercel deployment package for the SleepCheckup.cn sleep self-assessment tool.

## What is included

- `index.html` - the frontend experience, questionnaire flow, report page, and report image generation.
- `api/generate-report.js` - Vercel serverless endpoint for AI report generation.
- `api/submit-consultation.js` - consultation submission endpoint.
- `api/report-error.js` - report error submission endpoint.
- `api/_feishu.js` - shared Feishu webhook helper.
- `vercel.json` - Vercel function configuration.

## Required Vercel environment variables

Set these in Vercel before deploying:

- `GLM_API_KEY`
- `FEISHU_WEBHOOK_URL`
- `FEISHU_BOT_SECRET`

## Recent update

The report page now includes an upgraded first-screen executive summary panel that turns the generated results into:

- a clear top-line conclusion
- sleep debt, sleep type, and recovery status highlights
- prioritized next-step guidance
- concise key findings before the longer AI interpretation

