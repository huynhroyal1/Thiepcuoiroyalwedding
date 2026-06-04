const j = require('./scripts/imported-templates/content/mewedding-foreign-basic.json');
const keys = Object.keys(j);
console.log('Total keys:', keys.length);
console.log('ROOT nodes:', JSON.stringify(j.ROOT?.nodes?.slice(0, 5)));
const nonSec = Object.entries(j).filter(([k,v]) => !k.includes('SECTION') && k !== 'ROOT').slice(0, 20);
nonSec.forEach(([k,v]) => {
  const p = v?.props;
  const text = (p?.content || p?.src || '').toString().substring(0, 40);
  console.log(`${k}: ${v?.type?.resolvedName} left=${p?.left} top=${p?.top} w=${p?.width} h=${p?.height} text="${text}"`);
});
