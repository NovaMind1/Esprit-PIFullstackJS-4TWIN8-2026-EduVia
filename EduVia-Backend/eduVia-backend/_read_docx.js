const mammoth = require('mammoth');
const fs = require('fs');
const path = process.argv[1];
mammoth.extractRawText({path}).then(r => {
  console.log(r.value);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
