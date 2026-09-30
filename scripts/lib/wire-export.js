const fs = require('fs');
const bs58 = require('bs58');
const lz = require('@layerzerolabs/lz-definitions');

// Reads a transaction list exported by `lz:oapp:wire --output-filename` and normalizes each entry to
// `{ eid, to, data, description }`.
//
// Two export shapes are supported:
// - raw OmniTransactions: `{ point: { eid, address }, data, description }`, `data` is always hex
// - formatted OmniTransactions (newer devtools): `{ Endpoint, OmniAddress, Data, Description }`, where
//   `Endpoint` is the EndpointId name and `Data` is base58 for Solana and hex for everything else
//
// `data` is returned as hex for EVM transactions and as a Buffer for Solana transactions.
function readWireExport(path) {
    const txns = JSON.parse(fs.readFileSync(path, 'utf8'));

    return txns.map(txn => {
        if (txn.point) {
            const isSolana = lz.endpointIdToChainType(txn.point.eid) === lz.ChainType.SOLANA;
            return {
                eid: txn.point.eid,
                to: txn.point.address,
                data: isSolana ? Buffer.from(txn.data.replace(/^0x/, ''), 'hex') : txn.data,
                description: txn.description,
            };
        }

        const eid = lz.EndpointId[txn.Endpoint];
        if (eid == null) {
            throw new Error(`Unknown endpoint ${txn.Endpoint}`);
        }
        const isSolana = lz.endpointIdToChainType(eid) === lz.ChainType.SOLANA;
        return {
            eid,
            to: txn.OmniAddress,
            data: isSolana ? Buffer.from(bs58.decode(txn.Data)) : txn.Data,
            description: txn.Description,
        };
    });
}

function isSolanaEid(eid) {
    return lz.endpointIdToChainType(eid) === lz.ChainType.SOLANA;
}

function groupByEid(txns) {
    const txnsByEid = {};
    txns.forEach(txn => {
        if (!txnsByEid[txn.eid]) {
            txnsByEid[txn.eid] = [];
        }
        txnsByEid[txn.eid].push(txn);
    });
    return txnsByEid;
}

module.exports = { readWireExport, isSolanaEid, groupByEid };
