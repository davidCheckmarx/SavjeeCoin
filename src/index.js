const childProcess = require('child_process');
const { Blockchain, Transaction } = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const {TRANSACTIONS} = require('./const');

const port1 = 5001;
const port2 = 5002;
const port3 = 5003;


const keys = [
    ec.genKeyPair(),
    ec.genKeyPair(),
    ec.genKeyPair()
];
const blockchain = new Blockchain();

function startProcess(path, args) {
    return new Promise((resolve, reject) => {
        let cp = childProcess.fork(path, args, {silent: true});
        setTimeout(() => resolve(cp), 1000);
        cp.once('error', reject)
    });
}

function createTransaction(fromAddress, toAddress, amount) {
    const myKey = keys.find((k) => k.getPublic('hex')  === fromAddress);
    if(!myKey) return;
    const transaction = new Transaction( fromAddress,  toAddress,  amount);
    transaction.signTransaction(myKey);
    blockchain.addTransaction(transaction);
    return transaction;
}

function setupTransactions() {
    const signedTransactions = TRANSACTIONS.map(  (t) => {
        const transaction = {
            fromAddress: keys[t.fromAddress - 1].getPublic('hex'),
            toAddress: keys[t.toAddress - 1].getPublic('hex'),
            amount: t.amount
        };
        console.log("=======================");
        console.log("fromAddress: ", transaction.fromAddress);
        console.log("toAddress: ", transaction.toAddress);
        console.log("amount: ", transaction.amount);
        console.log("=======================");
        return createTransaction(transaction.fromAddress,  transaction.toAddress,  transaction.amount);
    });

    console.log("=======================");
    console.log("mining, miner: ", keys[0].getPublic('hex'));
    blockchain.minePendingTransactions(keys[0].getPublic('hex'));
    console.log("=======================");

    signedTransactions.forEach((t, i) => {
        console.log("=======================");
        console.log(`Transaction #${i + 1} for ${t.amount} is ${blockchain.isTransactionMined(t) ? 'mined' : 'pooled'}`);
        console.log("=======================");
    });

    keys.forEach(k => {
        const key = k.getPublic('hex');
        console.log("=======================");
        console.log(`balance of address ${key} is ${blockchain.getBalanceOfAddress(key)}`);
        console.log("=======================");
    })
}

function sleep() {
    return new Promise(resolve => {
        setTimeout(resolve, 3000);
    });
}


(async function () {
    let cps = [{
            process: await startProcess(require.resolve('./BC_Part_5 p2p/p2p'), [port1]),
            key: keys[0]
        },
        {
            process:  await startProcess(require.resolve('./BC_Part_5 p2p/p2p'), [port2, port1]),
            key: keys[1]
        },
        {
            process: await startProcess(require.resolve('./BC_Part_5 p2p/p2p'), [port3, port2, port1]),
            key: keys[2]
        }
    ];

    cps.forEach((cp, i) => {
        cp.process.stdout.on('data', d => {
            d.toString().split('\n').slice(0, -1).forEach(l => {
                process.stdout.write(`[${keys[i].getPublic('hex')}] ${l}\n`);
            });
        });
    });

    await sleep();
    setupTransactions();
}());
