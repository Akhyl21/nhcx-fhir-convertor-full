# 🚀 START HERE — Run in 4 Steps

## Step 1 — Open in VS Code
File → Open Folder → select `nhcx-fhir-convertor`

---

## Step 2 — Run Backend
Open a terminal in VS Code (`Ctrl + backtick`):
```
cd backend
npm install
npm run dev
```
✅ You should see: `🚀 NHCX FHIR Convertor running on http://localhost:5000`

---

## Step 3 — Run Frontend
Open a **second terminal** (click `+` in terminal panel):
```
cd frontend
npm install
npm run dev
```
✅ You should see: `➜ Local: http://localhost:3000/`

---

## Step 4 — Open Browser
Go to: **http://localhost:3000**

---

## Test It Immediately
1. Click **Converter** in sidebar
2. Select **Claim** as use case
3. Drag `samples/csv/sample_claim.csv` into the upload box
4. Watch AI map the fields automatically
5. Click **Confirm Mapping → Generate FHIR Bundle**
6. Click **Download** to get your NHCX FHIR JSON

---

## Optional — Add LLM API Key (for AI-powered mapping)
Edit `backend/.env` and add your key:
```
OPENAI_API_KEY=sk-your-key-here
```
Without a key, rule-based mapping still works perfectly.

---

## Troubleshooting
| Error | Fix |
|---|---|
| `npm install` errors | Run: `npm install --legacy-peer-deps` |
| Port 5000 busy | Change `PORT=5001` in `backend/.env` |
| Port 3000 busy | Vite auto-picks 3001, use that |
