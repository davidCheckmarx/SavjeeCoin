const childProcess = require('child_process');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const port1 = 5000;
const port2 = 5001;
const port3 = 5002;
const key1 = ec.genKeyPair();
const key2 = ec.genKeyPair();
const key3 = ec.genKeyPair();

const cp1 = childProcess.fork(require.resolve('./BC_Part_5 p2p/p2p'), [port1], {silent: true});
const cp2 = childProcess.fork(require.resolve('./BC_Part_5 p2p/p2p'), [port2, port1], {silent: true});
const cp3 = childProcess.fork(require.resolve('./BC_Part_5 p2p/p2p'), [port3, port2, port1], {silent: true});

[cp1, cp2, cp3].forEach((cp, i) => {
    cp.stdout.on('data', d => {
        d.toString().split('\n').slice(0, -1).forEach(l => {
            process.stdout.write(`[${i + 1}] ${l}\n`);
        });
    });
});

cp1.stdout.on('data', d => {
    if (d.includes('transaction')) {
        // TODO: Mine
    }
});

function notifyTransaction(cp) {
    cp.stdin.write('transaction');
}
