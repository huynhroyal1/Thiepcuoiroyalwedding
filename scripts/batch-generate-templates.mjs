/**
 * Batch decode và tạo template từ meHappy HTML format
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const INBOX_DIR = join(__dirname, "..", "scripts", "imported-templates", "inbox");
const CONTENT_DIR = join(__dirname, "..", "scripts", "imported-templates", "content");

function extractImages(html) {
  const regex = /https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp|gif)/gi;
  return [...new Set(html.match(regex) || [])];
}

function extractTexts(html) {
  const texts = [];
  // Extract from text spans
  const spanRegex = /<span[^>]*>([^<]+)<\/span>/gi;
  let m;
  while ((m = spanRegex.exec(html)) !== null) {
    const t = m[1].trim();
    if (t && t.length > 1 && t.length < 200) {
      // Filter out garbled text
      if (!t.includes('�') && !t.match(/[A-Za-z]{20,}/)) {
        texts.push(t);
      }
    }
  }
  return [...new Set(texts)];
}

function extractColors(html) {
  const colors = [];
  const rgbRegex = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/g;
  let m;
  while ((m = rgbRegex.exec(html)) !== null) {
    const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
    // Filter out very dark/light colors
    if ((r + g + b) > 30 && (r + g + b) < 735) {
      colors.push(`rgb(${r}, ${g}, ${b})`);
    }
  }
  return [...new Set(colors)].slice(0, 20);
}

function extractFonts(html) {
  const fonts = [];
  const fontRegex = /font-family:\s*([^;]+)/gi;
  let m;
  while ((m = fontRegex.exec(html)) !== null) {
    const font = m[1].replace(/['"]/g, "").trim();
    if (font && !font.includes("sans-serif") && !font.includes("serif") && font.length < 50) {
      fonts.push(font);
    }
  }
  return [...new Set(fonts)].slice(0, 10);
}

function getTemplateId(filename) {
  return filename
    .replace(".raw.html", "")
    .replace(/^view-source_https?___/, "")
    .replace(/^mehappy-/, "")
    .replace(/[^a-z0-9-]/gi, "-")
    .toLowerCase();
}

function generateCraftJson(templateId, images, texts, colors, fonts, sampleImages) {
  const primaryColor = colors.find(c => c.includes("136, 0, 0") || c.includes("139, 69, 19")) || "rgb(136, 0, 0)";
  const bgColor = colors.find(c => c.includes("255, 248") || c.includes("255, 250")) || "rgb(255, 248, 247)";
  
  // Get meaningful images
  const coverImg = sampleImages.find(img => img.includes("full") || img.includes("-medium")) || images[0];
  const coupleImg = sampleImages.find(img => img.includes("1928")) || images[0];
  
  const templateName = texts.find(t => t.includes("&") && t.length < 30) || templateId;
  
  return {
    "template-section-cover": {
      type: { resolvedName: "SectionBlock" },
      isCanvas: true,
      props: {
        bgImage: coverImg,
        bgColor: bgColor,
        bgType: coverImg ? "image" : "color",
        overlayColor: primaryColor,
        overlayOpacity: 30,
        height: 800,
        elementId: "section-cover"
      },
      displayName: "Section - Cover",
      custom: {},
      hidden: false,
      nodes: ["template-txt-names", "template-txt-date"],
      linkedNodes: {},
      parent: "ROOT"
    },
    "template-txt-names": {
      type: { resolvedName: "TextBlock" },
      isCanvas: false,
      props: {
        content: templateName,
        fontSize: 36,
        fontFamily: "Great Vibes, cursive",
        color: primaryColor,
        textAlign: "center",
        fontWeight: "bold",
        elementId: "txt-names",
        top: 200,
        left: 50,
        width: 300,
        zIndex: 10
      },
      displayName: "Tên cặp đôi",
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
      parent: "template-section-cover"
    },
    "template-txt-date": {
      type: { resolvedName: "TextBlock" },
      isCanvas: false,
      props: {
        content: "SAVE THE DATE",
        fontSize: 14,
        fontFamily: "Montserrat, sans-serif",
        color: primaryColor,
        textAlign: "center",
        fontWeight: "600",
        letterSpacing: 4,
        elementId: "txt-date",
        top: 300,
        left: 100,
        width: 200,
        zIndex: 10
      },
      displayName: "Save The Date",
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
      parent: "template-section-cover"
    },
    "template-section-gallery": {
      type: { resolvedName: "SectionBlock" },
      isCanvas: true,
      props: {
        bgColor: bgColor,
        bgType: "color",
        height: 500,
        elementId: "section-gallery"
      },
      displayName: "Section - Gallery",
      custom: {},
      hidden: false,
      nodes: ["template-txt-gallery-title"],
      linkedNodes: {},
      parent: "ROOT"
    },
    "template-txt-gallery-title": {
      type: { resolvedName: "TextBlock" },
      isCanvas: false,
      props: {
        content: "Album Ảnh Cưới",
        fontSize: 24,
        fontFamily: "Playfair Display, serif",
        color: primaryColor,
        textAlign: "center",
        fontWeight: "bold",
        elementId: "txt-gallery-title",
        top: 30,
        left: 100,
        width: 200,
        zIndex: 10
      },
      displayName: "Tiêu đề Album",
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
      parent: "template-section-gallery"
    },
    "template-section-rsvp": {
      type: { resolvedName: "SectionBlock" },
      isCanvas: true,
      props: {
        bgColor: primaryColor,
        bgType: "color",
        height: 350,
        elementId: "section-rsvp"
      },
      displayName: "Section - RSVP",
      custom: {},
      hidden: false,
      nodes: ["template-wishes-block"],
      linkedNodes: {},
      parent: "ROOT"
    },
    "template-wishes-block": {
      type: { resolvedName: "WishesBlock" },
      isCanvas: false,
      props: {
        title: "Gửi Lời Chúc",
        placeholder: "Nhập lời chúc của bạn...",
        submitLabel: "Gửi Lời Chúc",
        elementId: "wishes-block",
        top: 80,
        left: 40,
        width: 320
      },
      displayName: "Khối lời chúc",
      custom: {},
      hidden: false,
      nodes: [],
      linkedNodes: {},
      parent: "template-section-rsvp"
    },
    "ROOT": {
      type: { resolvedName: "RootCanvas" },
      isCanvas: true,
      props: {},
      displayName: "",
      custom: {},
      hidden: false,
      nodes: ["template-section-cover", "template-section-gallery", "template-section-rsvp"],
      linkedNodes: {}
    }
  };
}

// Get all raw HTML files
const files = readdirSync(INBOX_DIR).filter(f => f.endsWith(".raw.html"));

console.log(`\n=== Batch Generate ${files.length} Templates ===\n`);

const manifest = [];
const contentFiles = [];

for (const file of files) {
  const filePath = join(INBOX_DIR, file);
  const templateId = `mehappy-${getTemplateId(file)}`;
  
  console.log(`Processing: ${file}`);
  
  try {
    const html = readFileSync(filePath, "utf8");
    
    const images = extractImages(html);
    const texts = extractTexts(html);
    const colors = extractColors(html);
    const fonts = extractFonts(html);
    
    console.log(`  ✓ Images: ${images.length}, Texts: ${texts.length}, Colors: ${colors.length}`);
    console.log(`  Sample texts: ${texts.slice(0, 3).join(", ")}`);
    
    if (images.length > 0 || texts.length > 0) {
      const craftJson = generateCraftJson(templateId, images, texts, colors, fonts, images);
      
      const contentFile = `${templateId}.json`;
      writeFileSync(
        join(CONTENT_DIR, contentFile),
        JSON.stringify(craftJson, null, 2),
        "utf8"
      );
      contentFiles.push({ id: templateId, file: contentFile, images: images.length });
      
      manifest.push({
        id: templateId,
        name: `Template ${templateId.replace("mehappy-", "").toUpperCase()}`,
        description: `Template meHappy - ${texts.slice(0, 2).join(" ")}`,
        thumbnail_url: images.find(img => img.includes("medium") || img.includes("-m")) || images[0],
        preview_url: null,
        plan_required: "pro",
        style_tags: ["Import meHappy", "Wedding"],
        sort_order: 90,
        is_active: true,
        content_type: "craft",
        content_file: contentFile
      });
      
      console.log(`  ✓ Created: ${contentFile}`);
    }
    
  } catch (err) {
    console.log(`  ✗ Error: ${err.message}`);
  }
}

// Save manifest
console.log(`\n=== Summary ===`);
console.log(`Templates created: ${contentFiles.length}`);
console.log(`Content files: ${contentFiles.map(f => f.id).join(", ")}`);
