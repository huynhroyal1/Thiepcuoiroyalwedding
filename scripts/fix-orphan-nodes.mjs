/**
 * Script kiểm tra và fix orphan nodes trong Craft JSON
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONTENT_DIR = join(__dirname, "..", "scripts", "imported-templates", "content");

const templatesToCheck = [
  "mehappy-brightly-pro",
  "aurora-new07-pro",
  "mehappy-hb04-pro",
  "mehappy-brightly-basic",
  "mehappy-th01-new",
  "mehappy-lovestory-new"
];

function checkAndFixTemplate(templateId) {
  const filePath = join(CONTENT_DIR, `${templateId}.json`);
  
  try {
    const content = readFileSync(filePath, "utf8");
    const json = JSON.parse(content);
    
    const nodeIds = new Set(Object.keys(json).filter(k => k !== "ROOT"));
    const rootNodes = new Set(json.ROOT?.nodes || []);
    
    let issues = [];
    let fixed = 0;
    
    // 1. Kiểm tra các node trong ROOT có tồn tại không
    const orphanInRoot = [];
    for (const nodeId of rootNodes) {
      if (!nodeIds.has(nodeId)) {
        orphanInRoot.push(nodeId);
        issues.push(`ROOT has orphan node: ${nodeId}`);
      }
    }
    
    // 2. Kiểm tra các node có parent tồn tại không
    for (const [nodeId, node] of Object.entries(json)) {
      if (nodeId === "ROOT") continue;
      
      const parent = node.parent;
      if (parent && parent !== "ROOT") {
        // Kiểm tra parent có trong JSON không
        if (!json[parent]) {
          issues.push(`${nodeId} has invalid parent: ${parent}`);
          // Fix: đặt parent = ROOT
          node.parent = "ROOT";
          fixed++;
        }
      }
      
      // Kiểm tra node này có trong parent.nodes không
      if (parent && json[parent]?.nodes) {
        if (!json[parent].nodes.includes(nodeId)) {
          issues.push(`${nodeId} not in parent ${parent}.nodes`);
          // Fix: thêm vào parent.nodes
          json[parent].nodes.push(nodeId);
          fixed++;
        }
      }
    }
    
    // 3. Kiểm tra node trong nodes array có parent đúng không
    for (const [nodeId, node] of Object.entries(json)) {
      if (nodeId === "ROOT" || !node.isCanvas) continue;
      
      for (const childId of (node.nodes || [])) {
        if (json[childId] && json[childId].parent !== nodeId) {
          issues.push(`${childId} has parent ${json[childId].parent} but is in ${nodeId}.nodes`);
          // Fix: đặt parent đúng
          json[childId].parent = nodeId;
          fixed++;
        }
      }
    }
    
    // 4. Xóa orphan nodes khỏi ROOT.nodes
    if (orphanInRoot.length > 0) {
      json.ROOT.nodes = json.ROOT.nodes.filter(n => !orphanInRoot.includes(n));
      fixed += orphanInRoot.length;
    }
    
    // Báo cáo
    console.log(`\n=== ${templateId} ===`);
    console.log(`Total nodes: ${nodeIds.size}`);
    console.log(`Issues found: ${issues.length}`);
    
    if (issues.length > 0) {
      issues.slice(0, 10).forEach(i => console.log(`  - ${i}`));
      if (issues.length > 10) console.log(`  ... and ${issues.length - 10} more`);
    }
    
    if (fixed > 0) {
      console.log(`Fixed: ${fixed} issues`);
      writeFileSync(filePath, JSON.stringify(json, null, 2), "utf8");
      console.log(`Saved: ${filePath}`);
    } else {
      console.log(`No fixes needed`);
    }
    
    return { issues, fixed };
    
  } catch (err) {
    console.log(`\n=== ${templateId} ===`);
    console.log(`ERROR: ${err.message}`);
    return { issues: [err.message], fixed: 0 };
  }
}

console.log("=== Template Integrity Check & Fix ===\n");

let totalFixed = 0;
let totalIssues = 0;

for (const templateId of templatesToCheck) {
  const result = checkAndFixTemplate(templateId);
  totalFixed += result.fixed;
  totalIssues += result.issues.length;
}

console.log(`\n=== SUMMARY ===`);
console.log(`Templates checked: ${templatesToCheck.length}`);
console.log(`Total issues: ${totalIssues}`);
console.log(`Total fixed: ${totalFixed}`);
