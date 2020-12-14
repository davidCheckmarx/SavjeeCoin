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
]
let savjeeCoin = new Blockchain();
const allSavjeeCoin = [savjeeCoin]

function startProcess(path, args) {
    return new Promise((resolve, reject) => {
        let cp = childProcess.fork(path, args, {silent: true});
        setTimeout(() => resolve(cp), 1000);
        cp.once('error', reject)
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



    process.stdin.on('data', d => {
        const data = d.toString().split(" ")
        if(data.length === 3){
            createTransaction(data[0],  data[0],  +data[2])
            const cp = cps.find((cp) => cp.key.getPublic('hex')  === data[0])
            cp.process.stdin.write(`fromAddress: ${data[0]} \n toAddress: ${data[1]} \n amount: ${+data[2]} \n miner: ${keys[0].getPublic('hex')}\n`)
            console.log("=================")
            console.log("getBalanceOfAddress:", getBalanceOfAddress(data[0]))
        }
    });
    setupTransaction()
}());

function setupTransaction() {
    TRANSACTIONS.forEach(  (t) => {
        const transaction = {
            fromAddress: keys[t.fromAddress - 1].getPublic('hex'),
            toAddress: keys[t.toAddress - 1].getPublic('hex'),
            amount:30
        }
        console.log("=======================")
        console.log("fromAddress: ", transaction.fromAddress)
        console.log("toAddress: ", transaction.toAddress)
        console.log("amount: ", transaction.amount)
        console.log("miner: ", keys[0].getPublic('hex'))
        console.log("=======================")
        createTransaction(transaction.fromAddress,  transaction.toAddress,  transaction.amount)
    })
}


function createTransaction(fromAddress, toAddress, amount) {
    const myKey = keys.find((k) => k.getPublic('hex')  === fromAddress)
    if(!myKey) return
    if(savjeeCoin.chain.length === 4) {
        savjeeCoin = new Blockchain()
        allSavjeeCoin.push(savjeeCoin)
    }
    const transaction = new Transaction( fromAddress,  toAddress,  amount);
    transaction.signTransaction(myKey);
    savjeeCoin.addTransaction(transaction);
    savjeeCoin.minePendingTransactions(keys[0].getPublic('hex'));
}

const getBalanceOfAddress = (publicKey) =>
    allSavjeeCoin.reduce((prev, next) => next.getBalanceOfAddress(publicKey) + prev, 0)


