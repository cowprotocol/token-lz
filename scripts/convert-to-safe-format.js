#!/usr/bin/env node

const fs = require('fs');

if (process.argv.length != 3) {
    console.error('convert-to-safe-format.js -- A script to convert a transaction list from lz:oapp:wire to Safe Transaction Builder format.')
    console.error(`Usage: ${process.argv[0]} ${process.argv[1]} <path/to/wire/export.json>`)
    process.exit(1);
}

// Read the input transactions
const txns = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

// Group transactions by EID
const txnsByEid = {};

txns.forEach(txn => {
  const eid = txn.point.eid;
  if (!txnsByEid[eid]) {
    txnsByEid[eid] = [];
  }
  txnsByEid[eid].push(txn);
});

// Convert to Safe Transaction Builder format
// The Safe Transaction Builder expects a format like:
// {
//   "version": "1.0",
//   "chainId": "1",
//   "createdAt": 1234567890,
//   "meta": {},
//   "transactions": [
//     {
//       "to": "0x...",
//       "value": "0",
//       "data": "0x...",
//       "contractMethod": null,
//       "contractInputsValues": null
//     }
//   ]
// }

Object.keys(txnsByEid).forEach(eid => {
  const transactions = txnsByEid[eid].map(txn => ({
    to: txn.point.address,
    value: "0",
    data: txn.data,
    contractMethod: null,
    contractInputsValues: null
  }));

  const safeFormat = {
    version: "1.0",
    chainId: eid,
    createdAt: Date.now(),
    meta: {
      name: `Transactions for EID ${eid}`,
      description: "LayerZero configuration transactions",
      txBuilderVersion: "1.16.3"
    },
    transactions
  };

  // Write to file
  const filename = `safe-txns-eid-${eid}.json`;
  fs.writeFileSync(filename, JSON.stringify(safeFormat, null, 2));
  console.log(`Created ${filename} with ${transactions.length} transactions`);
});
