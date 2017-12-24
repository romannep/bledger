'use strict';

const bledger = require('../lib/bledger');
const {LedgerBcoin} = bledger;
const {Device} = bledger.hid;

const KeyRing = require('bcoin/lib/primitives/keyring');

const devices = Device.getDevices();

const NETWORK = 'regtest';
const XPUBS = 1;
const ADDRESSES = 4;
const CHANGE = true;

(async () => {
  const device = new Device({
    device: devices[0],
    timeout: 5000
  });

  await device.open();

  const ledgerBcoin = new LedgerBcoin({
    device: device
  });

  const xpubs = {};

  for (let i = 0; i < XPUBS; i++) {
    const path = `m/44'/0'/${i}'`;

    xpubs[path] = await getPublicKey(ledgerBcoin, path);
  }

  for (const key of Object.keys(xpubs)) {
    const xpub = xpubs[key];

    console.log(`Account: ${key} addresses:`);
    for (let i = 0; i < ADDRESSES; i++) {
      const address = deriveAddress(xpub, 0, i, NETWORK);

      console.log(`  /0/${i}: ${address}`);

      if (CHANGE) {
        const change = deriveAddress(xpub, 1, i, NETWORK);
        console.log(`  /1/${i}: ${change}\n`);
      }
    }
  }

  await device.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

async function getPublicKey(btc, path) {
  return await btc.getPublicKey(path);
}

function deriveAddress(hd, change, index, network) {
  const pubkey = hd.derive(change).derive(index);
  const kr = KeyRing.fromPublic(pubkey.publicKey, network);

  return kr.getAddress().toString();
}
