const fs = require('fs');
const html = fs.readFileSync('./scripts/imported-templates/inbox/mewedding-lightly.clean.html', 'utf8');

// Find all https URLs - better regex
const urls = html.match(/https:\/\/[a-zA-Z0-9_/.:?=&%-]+/g) || [];
const unique = [...new Set(urls)];
console.log('Total unique URLs:', unique.length);
unique.forEach(u => console.log(u.substring(0, 120)));
