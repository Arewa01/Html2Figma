import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

const app = express();
app.use(cors({ origin: "https://www.figma.com" }));
app.use(bodyParser.json());

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "HTML to Figma Backend",
    timestamp: new Date().toISOString(),
  });
});

app.post("/scrape", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: "URL is required" });
  }

  try {
    const executablePath =
      (await chromium.executablePath) || "/usr/bin/google-chrome";

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    const title = await page.title();
    const html = await page.content();

    await browser.close();

    res.json({
      success: true,
      data: { title, html },
    });
  } catch (error) {
    console.error("Scrape failed:", error);
    res.status(500).json({
      success: false,
      error: "Failed to scrape website",
      details: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
