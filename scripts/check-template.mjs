// Usage: node check-template.mjs <templateId>
// Example: node check-template.mjs mehappy-pham-tuan-nguyen-them

const templateId = process.argv[2] || 'mehappy-pham-tuan-nguyen-them';

async function main() {
  const baseUrl = 'http://localhost:3000/api/marketing/templates?ids=' + templateId;
  
  try {
    console.log('Fetching from:', baseUrl);
    const res = await fetch(baseUrl);
    const json = await res.json();
    const templates = json.data || json;
    
    if (Array.isArray(templates) && templates.length > 0) {
      const t = templates[0];
      console.log('\n=== TEMPLATE INFO ===');
      console.log('ID:', t.id);
      console.log('Name:', t.name);
      console.log('Is Active:', t.is_active);
      
      if (t.content_json) {
        const cj = typeof t.content_json === 'string' ? JSON.parse(t.content_json) : t.content_json;
        console.log('Keys in content_json:', Object.keys(cj).filter(k => !k.startsWith('UNSTABLE')).join(', '));
        
        const rootNode = cj['ROOT'];
        console.log('Root type:', rootNode?.type);
        console.log('Root resolvedName:', rootNode?.type?.resolvedName);
        
        const blockTypes = new Set();
        for (const [k, node] of Object.entries(cj)) {
          if (typeof node === 'object' && node !== null && node.type?.resolvedName) {
            blockTypes.add(node.type.resolvedName);
          }
        }
        console.log('Block types:', [...blockTypes].join(', '));
        
        // Show root nodes
        if (rootNode?.nodes) {
          console.log('Root nodes:', JSON.stringify(rootNode.nodes));
        }
        
        // Show first 3 node details
        console.log('\n=== FIRST 3 NODES ===');
        const entries = Object.entries(cj).filter(([k]) => !k.startsWith('UNSTABLE') && k !== 'canvas').slice(0, 3);
        for (const [k, node] of entries) {
          if (typeof node === 'object') {
            console.log(`\n[${k}]:`, JSON.stringify(node, null, 2).slice(0, 500));
          }
        }
        
        // Show canvas if exists
        if (cj.canvas) {
          console.log('\n=== CANVAS ===');
          console.log(JSON.stringify(cj.canvas, null, 2).slice(0, 2000));
        }
        
      } else {
        console.log('No content_json');
      }
    } else {
      console.log('Template not found. Response:', JSON.stringify(json).slice(0, 500));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
