/**
 * Scrape LadiPage HTML + computed positions via Playwright.
 * LadiPage stores positions in CSS rules, not inline styles.
 * This script uses Playwright to render the page and extract computed positions.
 * Usage: node scripts/scrape-ladipage-computed.mjs foreign-basic
 */
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const id = process.argv[2] || "foreign-basic";
const out =
  process.argv[3] ||
  join(__dirname, "imported-templates/inbox", `ladipage-${id}-computed.json`);

const outDir = dirname(out);
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

// meWedding URL
const url = `https://www.mewedding.vn/giao-dien-${id}`;

console.log(`Opening: ${url}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);

  // Wait for LadiPage to fully render
  await page.waitForSelector(".ladi-section", { timeout: 30000 });

  // Scroll to trigger all lazy-load
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = Math.max(320, Math.floor(window.innerHeight * 0.8));
    let y = 0;
    const max = Math.max(document.body.scrollHeight, 5000);
    while (y < max) {
      window.scrollTo(0, y);
      await wait(150);
      y += step;
    }
    window.scrollTo(0, 0);
    await wait(500);
  });

  // Extract all element data with computed styles
  const elementData = await page.evaluate(() => {
    const result = {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      sections: [],
      elements: [],
    };

    // Get all ladi-section
    document.querySelectorAll(".ladi-section").forEach((sec, idx) => {
      const rect = sec.getBoundingClientRect();
      const styles = window.getComputedStyle(sec);
      result.sections.push({
        id: sec.id,
        class: sec.className,
        rect: {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        style: {
          height: styles.height,
          backgroundColor: styles.backgroundColor,
          backgroundImage: styles.backgroundImage,
        },
      });

      // Get all elements within section
      sec.querySelectorAll(".ladi-element").forEach((el) => {
        const elRect = el.getBoundingClientRect();
        const elStyles = window.getComputedStyle(el);
        const childEl = el.querySelector(".ladi-headline, .ladi-paragraph, .ladi-image, .ladi-box, .ladi-button, .ladi-shape, .ladi-gallery, .ladi-carousel, .ladi-form");
        const childStyles = childEl ? window.getComputedStyle(childEl) : null;

        result.elements.push({
          id: el.id,
          class: el.className.split(" ").filter(c => c.startsWith("ladi-")).join(" "),
          parentId: sec.id,
          rect: {
            top: Math.round(elRect.top - rect.top),
            left: Math.round(elRect.left - rect.left),
            width: Math.round(elRect.width),
            height: Math.round(elRect.height),
          },
          computed: {
            top: Math.round(elRect.top),
            left: Math.round(elRect.left),
            width: Math.round(elRect.width),
            height: Math.round(elRect.height),
          },
          styles: {
            position: elStyles.position,
            width: elStyles.width,
            height: elStyles.height,
            top: elStyles.top,
            left: elStyles.left,
          },
          text: el.textContent?.trim().substring(0, 100) || "",
          childType: childEl?.className || "",
          childStyles: childStyles ? {
            color: childStyles.color,
            fontSize: childStyles.fontSize,
            fontFamily: childStyles.fontFamily,
            textAlign: childStyles.textAlign,
            fontWeight: childStyles.fontWeight,
            backgroundColor: childStyles.backgroundColor,
            backgroundImage: childStyles.backgroundImage,
            lineHeight: childStyles.lineHeight,
          } : null,
        });
      });
    });

    return result;
  });

  console.log(`Sections: ${elementData.sections.length}`);
  console.log(`Elements: ${elementData.elements.length}`);

  // Print summary
  elementData.sections.forEach((s, i) => {
    console.log(`  Section[${i}] ${s.id}: ${s.rect.width}x${s.rect.height} (top:${s.rect.top})`);
  });

  await browser.close();

  // Save result
  writeFileSync(out, JSON.stringify(elementData, null, 2), "utf8");
  console.log(`\n✓ Saved to: ${out}`);

} catch (e) {
  console.error(`Error: ${e.message}`);
  await browser.close();
  process.exit(1);
}
