import { MNS, strToBytes, bytesToStr } from '@massalabs/massa-web3';
import { DOMAIN_SEPARATOR_KEY, initProvider } from './utils';
import { MNS_CONTRACT } from './config';

const provider = await initProvider();

const MNSContract = await MNS.init(provider);

// Claim dns
const domain = 'testaurelienlolloulilolsdsdssdsd';

const op = await MNSContract.alloc(domain, provider.address, {
  coins: BigInt(2000000000),
});

const events = await op.getSpeculativeEvents();
if (events.length) {
  console.log(events.map((e) => e.data));
}

const domainOwner = await MNSContract.resolve(domain);

if (domainOwner === provider.address) {
  console.log('OK! Domain is owned by the current account');
} else {
  console.error('KO! Domain is not owned by the current account');
}

// get owned tokens
const OWNED_TOKENS_KEY = strToBytes('ownedTokens');
const OWNED_FILTER = Uint8Array.from([
  ...OWNED_TOKENS_KEY,
  ...strToBytes(provider.address),
]);
const ownedkeys = await provider.getStorageKeys(
  MNS_CONTRACT,
  OWNED_FILTER,
  false,
);
console.log('Nb owned tokens:', ownedkeys.length);
const domainKeys = ownedkeys.map((k) => {
  const tokenIdBytes = k.slice(OWNED_FILTER.length);
  const DOMAIN_KEY_PREFIX = [0x03];

  return Uint8Array.from([
    ...DOMAIN_SEPARATOR_KEY,
    ...DOMAIN_KEY_PREFIX,
    ...tokenIdBytes,
  ]);
});
const domainsBytes = await provider.readStorage(
  MNS_CONTRACT,
  domainKeys,
  false,
);
const domains = domainsBytes.map((d) => bytesToStr(d));
console.log('Owned domains:', domains);
if (!domains.includes(domain)) {
  console.error('KO! Domain is not in the owned domains');
}
