const tables = require('./classification-tables.js');
const table = tables[0];
console.log('Query string:', table.query);
const fullQuery = 'SELECT * FROM blocks ' + table.query;
console.log('Full:', fullQuery);