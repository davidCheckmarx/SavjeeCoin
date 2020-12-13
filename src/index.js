const childProcess = require('child_process');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const port1 = 5001;
const port2 = 5002;
const port3 = 5003;
const key1 = ec.genKeyPair();
const key2 = ec.genKeyPair();
const key3 = ec.genKeyPair();

function startProcess(path, args) {
    return new Promise((resolve, reject) => {
        let cp = childProcess.fork(path, args, {silent: true});
        setTimeout(() => resolve(cp), 1000);
        cp.once('error', reject)
    });
}

function notifyTransaction(cp) {
    cp.stdin.write('transaction');
}

(async function () {
    let cps = [
        await startProcess(require.resolve('./BC_Part_5 p2p/p2p'), [port1]),
        await startProcess(require.resolve('./BC_Part_5 p2p/p2p'), [port2, port1]),
        await startProcess(require.resolve('./BC_Part_5 p2p/p2p'), [port3, port2, port1])
    ];

    cps.forEach((cp, i) => {
        cp.stdout.on('data', d => {
            d.toString().split('\n').slice(0, -1).forEach(l => {
                process.stdout.write(`[${i + 1}] ${l}\n`);
            });
        });
    });

    process.stdin.on('data', d => {
        notifyTransaction(cps[+d.toString() - 1])
    });
}());

// cp1.stdout.on('data', d => {
//     if (d.includes('transaction')) {
//         // TODO: Mine
//     }
// });
