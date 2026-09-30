import {
  Args,
  boolToByte,
  bytesToU256,
  nativeTypeArrayToBytes,
  stringToBytes,
  u256ToBytes,
} from '@massalabs/as-types';
import {
  constructor,
  name,
  dnsAlloc,
  dnsFree,
  dnsResolve,
  dnsUpdateTarget,
  transferInternalCoins,
  getTokenIdFromDomain,
  getDomainFromTokenId,
  symbol,
  balanceOf,
  ownerOf,
  transferFrom,
  approve,
  setOwner,
  ownerAddress,
  setApprovalForAll,
  getApproved,
  isApprovedForAll,
  dnsReverseResolve,
  dnsReverseResolvePage,
  dnsUnlock,
  dnsLock,
} from '../contracts/main';
import {
  balance,
  balanceOf as mockedBalance,
  changeCallStack,
  mockAdminContext,
  mockBalance,
  mockTransferredCoins,
  resetStorage,
  getKeys,
} from '@massalabs/massa-as-sdk';
import { u256 } from 'as-bignum/assembly';
// eslint-disable-next-line max-len
import { OWNED_TOKENS_KEY } from '@massalabs/sc-standards/assembly/contracts/MRC721/enumerable/MRC721Enumerable-internals';

const defaultOwner = 'AU12UBnqTHDQALpocVBnkPNy7y5CndUJQTLutaVDDFgMJcq5kQiKq';
const owner = 'AU122Em8qkqegdLb1eyH8rdkSCNEf7RZLeTJve4Q2inRPGiTJ2xNv';

const target = 'AU12W92UyGW4Bd94BPniTq4Ra5yhiv6RvjazV2G9Q9GyekYkgqbme';
const domain = 'test30999009';
// address of the contract set in vm-mock. must match with contractAddr of @massalabs/massa-as-sdk/vm-mock/vm.js
const scAddress = 'AS12BqZEQ6sByhRLyEuf0YbQmcF2PsDdkNNG1akBJu9XcjZA1eT';
const transferredAmount = 1_100_000_000;

function switchUser(user: string): void {
  changeCallStack(user + ' , ' + scAddress);
}

// TESTS DNS RELATED FUNCTIONS

describe('Test DNS allocation', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
  });
  afterEach(() => {
    mockTransferredCoins(0);
    mockBalance(scAddress, 0);
    switchUser(owner);
  });
  test('Testing admin success alloc', () => {
    let argsCost = new Args();
    argsCost.add(domain);
    mockBalance(defaultOwner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    let args = new Args();
    args.add(domain);
    args.add(target);

    // check no tokens are owned by defaultOwner
    let keys = getKeys(OWNED_TOKENS_KEY.concat(stringToBytes(defaultOwner)));
    expect(keys.length).toStrictEqual(0);

    expect(dnsAlloc(args.serialize())).toStrictEqual(u256ToBytes(u256.Zero));

    // check owned
    const filter = OWNED_TOKENS_KEY.concat(stringToBytes(defaultOwner));
    keys = getKeys(filter);
    expect(keys.length).toStrictEqual(1);
    const tokenId = nativeTypeArrayToBytes(keys[0].slice(filter.length));
    expect(tokenId).toStrictEqual(u256ToBytes(u256.Zero));
  });
  test('Testing multiple alloc', () => {
    let argsCost = new Args();
    argsCost.add(domain);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    let args = new Args();
    args.add(domain);
    args.add(target);
    expect(dnsAlloc(args.serialize())).toStrictEqual(u256ToBytes(u256.Zero));

    // check owned
    let filter = OWNED_TOKENS_KEY.concat(stringToBytes(owner));
    let keys = getKeys(filter);
    expect(keys.length).toStrictEqual(1);
    const tokenId1 = nativeTypeArrayToBytes(keys[0].slice(filter.length));
    expect(tokenId1).toStrictEqual(u256ToBytes(u256.Zero));

    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    let args2 = new Args();
    args2.add('test29087890');
    args2.add(target);
    expect(dnsAlloc(args2.serialize())).toStrictEqual(u256ToBytes(u256.One));

    // check owned
    filter = OWNED_TOKENS_KEY.concat(stringToBytes(owner));
    keys = getKeys(filter);
    expect(keys.length).toStrictEqual(2);
    const tokenId2 = nativeTypeArrayToBytes(keys[1].slice(filter.length));
    expect(tokenId2).toStrictEqual(u256ToBytes(u256.One));
  });
  throws('No funds sent', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    dnsAlloc(args.serialize());
  });
  throws('Too low funds sent', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, 100_000_000);
    mockTransferredCoins(100_000_000);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args.serialize());
  });
  throws('Invalid domain', () => {
    let args = new Args();
    args.add('(invalid)');
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args.serialize());
  });
  throws('Invalid target', () => {
    let args = new Args();
    args.add(domain);
    args.add('lol'.repeat(51));
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args.serialize());
  });
  throws('Domain already exists', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args.serialize());
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args.serialize());
  });
  throws('Alloc while locked', () => {
    let argsCost = new Args();
    argsCost.add(domain);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(scAddress, transferredAmount);
    switchUser(target);
    expect(dnsAlloc(args.serialize())).toStrictEqual(u256ToBytes(u256.Zero));
  });
  test('Alloc after unlock', () => {
    dnsUnlock(new Args().serialize());
    let argsCost = new Args();
    argsCost.add(domain);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(scAddress, transferredAmount);
    switchUser(target);
    expect(dnsAlloc(args.serialize())).toStrictEqual(u256ToBytes(u256.Zero));
  });
  throws('Alloc after unlock and lock', () => {
    dnsUnlock(new Args().serialize());
    dnsLock(new Args().serialize());
    let argsCost = new Args();
    argsCost.add(domain);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(scAddress, transferredAmount);
    switchUser(target);
    expect(dnsAlloc(args.serialize())).toStrictEqual(u256ToBytes(u256.Zero));
  });
});

describe('Test DNS free', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
    dnsUnlock(new Args().serialize());
  });
  afterEach(() => {
    mockBalance(scAddress, 0);
    mockTransferredCoins(0);
    switchUser(owner);
  });
  test('Test success free', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    const tokenId = bytesToU256(dnsAlloc(args.serialize()));
    let argsFree = new Args();
    argsFree.add(tokenId);
    mockTransferredCoins(0);
    mockBalance(scAddress, transferredAmount / 2);
    dnsFree(argsFree.serialize());

    // check owned
    let filter = OWNED_TOKENS_KEY.concat(stringToBytes(owner));
    let keys = getKeys(filter);
    expect(keys.length).toStrictEqual(0);
  });
  test('Alloc again after free', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    const tokenId = bytesToU256(dnsAlloc(args.serialize()));
    let argsFree = new Args();
    argsFree.add(tokenId);
    mockBalance(scAddress, transferredAmount / 2);
    mockTransferredCoins(0);
    dnsFree(argsFree.serialize());
    let args2 = new Args();
    args2.add(domain);
    args2.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args2.serialize());

    // check owned
    let filter = OWNED_TOKENS_KEY.concat(stringToBytes(owner));
    let keys = getKeys(filter);
    expect(keys.length).toStrictEqual(1);
    const tokenId1 = nativeTypeArrayToBytes(keys[0].slice(filter.length));
    expect(tokenId1).toStrictEqual(u256ToBytes(u256.One));
  });
  throws('Domain not found', () => {
    let args = new Args();
    args.add(domain);
    dnsFree(args.serialize());
  });
  throws('Not enough funds', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    const tokenId = bytesToU256(dnsAlloc(args.serialize()));
    let argsFree = new Args();
    argsFree.add(tokenId);
    mockBalance(scAddress, transferredAmount / 4);
    mockTransferredCoins(0);
    dnsFree(argsFree.serialize());
  });
});

describe('Test DNS resolve', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
    dnsUnlock(new Args().serialize());
  });
  afterEach(() => {
    mockTransferredCoins(0);
    mockBalance(scAddress, 0);
    switchUser(owner);
  });
  test('Test success resolve', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args.serialize());
    let argsResolve = new Args();
    argsResolve.add(domain);
    expect(dnsResolve(argsResolve.serialize())).toStrictEqual(
      stringToBytes(target),
    );
  });
  throws('Domain not found', () => {
    let args = new Args();
    args.add(domain);
    dnsResolve(args.serialize());
  });
});

describe('Test DNS change target', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
  });
  afterEach(() => {
    mockTransferredCoins(0);
    mockBalance(scAddress, 0);
    switchUser(owner);
  });
  test('Test success change target', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args.serialize());
    let newTarget = 'AU12W92UyGW4Bd94BPniTq4Ra5yhiv6RvjazV2G9Q9GyekYkgqbme';
    let argsChange = new Args();
    argsChange.add(domain);
    argsChange.add(newTarget);
    dnsUpdateTarget(argsChange.serialize());
    let argsResolve = new Args();
    argsResolve.add(domain);
    expect(dnsResolve(argsResolve.serialize())).toStrictEqual(
      stringToBytes(newTarget),
    );
  });
  throws('Domain not found', () => {
    let args = new Args();
    args.add(domain);
    dnsUpdateTarget(args.serialize());
  });
  throws('Caller is not the owner', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args.serialize());
    let argsChange = new Args();
    argsChange.add(domain);
    argsChange.add(target);
    switchUser(target);
    dnsUpdateTarget(argsChange.serialize());
  });
});

describe('Test transfer internal coins', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
    dnsUnlock(new Args().serialize());
  });
  afterEach(() => {
    mockTransferredCoins(0);
    mockBalance(scAddress, 0);
    switchUser(owner);
  });
  test('Test transfer internal coins', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    dnsAlloc(args.serialize());

    const currentBalance = balance();
    const withdrawAmount = 1000;
    let argsTransfer = new Args();
    argsTransfer.add(target);
    argsTransfer.add<u64>(withdrawAmount);
    transferInternalCoins(argsTransfer.serialize());
    expect(mockedBalance(target)).toStrictEqual(withdrawAmount);
    expect(balance()).toStrictEqual(currentBalance - 1000);
  });
  throws('Test transfer internal coins not allowed', () => {
    mockBalance(scAddress, 1000);
    switchUser(target);
    let argsTransfer = new Args();
    argsTransfer.add(target);
    argsTransfer.add<u64>(1000);
    transferInternalCoins(argsTransfer.serialize());
  });
});

describe('Test get domain from tokenId', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
    dnsUnlock(new Args().serialize());
  });
  afterEach(() => {
    mockTransferredCoins(0);
    mockBalance(scAddress, 0);
    switchUser(owner);
  });
  test('Test get domain from tokenId', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    const tokenId = bytesToU256(dnsAlloc(args.serialize()));
    let argsGet = new Args();
    argsGet.add(tokenId);
    expect(getDomainFromTokenId(argsGet.serialize())).toStrictEqual(
      stringToBytes(domain),
    );
  });
  throws('TokenId not found', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args.serialize());
    let argsGet = new Args();
    argsGet.add<u256>(u256.One);
    getDomainFromTokenId(argsGet.serialize());
  });
});

describe('Test get tokenId from domain', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
    dnsUnlock(new Args().serialize());
  });
  afterEach(() => {
    mockTransferredCoins(0);
    mockBalance(scAddress, 0);
    switchUser(owner);
  });
  test('Test get tokenId from domain', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    const tokenId = bytesToU256(dnsAlloc(args.serialize()));
    let argsGet = new Args();
    argsGet.add(domain);
    expect(getTokenIdFromDomain(argsGet.serialize())).toStrictEqual(
      u256ToBytes(tokenId),
    );
  });
  throws('Domain not found', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args.serialize());
    let argsGet = new Args();
    argsGet.add('(invalid)');
    getTokenIdFromDomain(argsGet.serialize());
  });
});

describe('Test dnsReverseResolve', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
    dnsUnlock(new Args().serialize());
  });
  afterEach(() => {
    mockTransferredCoins(0);
    mockBalance(scAddress, 0);
    switchUser(owner);
  });
  test('Test success reverse resolve', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args.serialize());
    let secondArgs = new Args();
    secondArgs.add('test47843478');
    secondArgs.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(secondArgs.serialize());
    let argsResolve = new Args();
    argsResolve.add(target);
    expect(dnsReverseResolve(argsResolve.serialize())).toStrictEqual(
      stringToBytes(domain + ',test47843478'),
    );
  });
  test('Test reverse resolve after updateTarget', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args.serialize());
    let newTarget = 'AU122Em8qkqegdLb1eyH8rdkSCNEf7RZLeTJve4Q2inRPGiTJ2xNv';
    let argsChange = new Args();
    argsChange.add(domain);
    argsChange.add(newTarget);
    dnsUpdateTarget(argsChange.serialize());
    let argsResolve = new Args();
    argsResolve.add(newTarget);
    expect(dnsReverseResolve(argsResolve.serialize())).toStrictEqual(
      stringToBytes(domain),
    );
  });
  test('Test reverse resolve after free', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    let tokenId = bytesToU256(dnsAlloc(args.serialize()));
    let argsFree = new Args();
    argsFree.add(tokenId);
    mockTransferredCoins(0);
    mockBalance(scAddress, transferredAmount);
    dnsFree(argsFree.serialize());
    let argsResolve = new Args();
    argsResolve.add(target);
    expect(dnsReverseResolve(argsResolve.serialize())).toStrictEqual(
      stringToBytes(''),
    );
  });
});

function allocForTarget(domainName: string): void {
  let args = new Args();
  args.add(domainName);
  args.add(target);
  mockBalance(owner, transferredAmount);
  mockTransferredCoins(transferredAmount);
  mockBalance(scAddress, transferredAmount);
  dnsAlloc(args.serialize());
}

// Zero padded so that byte order, the order of the datastore keys, is numeric order.
function pagedDomain(i: i32): string {
  return 'paged' + i.toString().padStart(7, '0');
}

// Allocates `n` domains to `target` and returns them comma separated.
function allocPagedDomains(n: i32): string {
  let expected = '';
  for (let i = 0; i < n; i++) {
    const domainName = pagedDomain(i);
    allocForTarget(domainName);
    expected += i > 0 ? ',' + domainName : domainName;
  }
  return expected;
}

function joinPagedDomains(from: i32, to: i32): string {
  let joined = '';
  for (let i = from; i < to; i++) {
    joined += i > from ? ',' + pagedDomain(i) : pagedDomain(i);
  }
  return joined;
}

function reverseResolvePage(startDomain: string, count: i32): StaticArray<u8> {
  return dnsReverseResolvePage(
    new Args().add(target).add(startDomain).add(count).serialize(),
  );
}

describe('Test reverse resolve past the datastore keys page', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
    dnsUnlock(new Args().serialize());
  });
  afterEach(() => {
    mockTransferredCoins(0);
    mockBalance(scAddress, 0);
    switchUser(owner);
  });
  test('reverse resolve returns every domain over several pages', () => {
    const expected = allocPagedDomains(1001);
    expect(dnsReverseResolve(new Args().add(target).serialize())).toStrictEqual(
      stringToBytes(expected),
    );
  });
  test('reverse resolve returns exactly one full page', () => {
    const expected = allocPagedDomains(500);
    expect(dnsReverseResolve(new Args().add(target).serialize())).toStrictEqual(
      stringToBytes(expected),
    );
  });
  test('pages chain from the last domain of the previous page', () => {
    allocPagedDomains(1001);
    expect(reverseResolvePage('', 500)).toStrictEqual(
      stringToBytes(joinPagedDomains(0, 500)),
    );
    expect(reverseResolvePage(pagedDomain(499), 500)).toStrictEqual(
      stringToBytes(joinPagedDomains(500, 1000)),
    );
    expect(reverseResolvePage(pagedDomain(999), 500)).toStrictEqual(
      stringToBytes(pagedDomain(1000)),
    );
    expect(reverseResolvePage(pagedDomain(1000), 500)).toStrictEqual(
      stringToBytes(''),
    );
  });
  test('a page smaller than the maximum', () => {
    allocPagedDomains(5);
    expect(reverseResolvePage(pagedDomain(1), 2)).toStrictEqual(
      stringToBytes(pagedDomain(2) + ',' + pagedDomain(3)),
    );
  });
  test('a page of an address without domains is empty', () => {
    expect(reverseResolvePage('', 500)).toStrictEqual(stringToBytes(''));
  });
  throws('a page of 0 domains', () => {
    reverseResolvePage('', 0);
  });
  throws('a page above the datastore keys page', () => {
    reverseResolvePage('', 501);
  });
});

describe('Test NFT name', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
    dnsUnlock(new Args().serialize());
  });
  afterEach(() => {
    mockTransferredCoins(0);
    mockBalance(scAddress, 0);
    switchUser(owner);
  });
  test('Test NFT name', () => {
    expect(name()).toStrictEqual(stringToBytes('MassaNameService'));
  });
});

// TESTS NFT RELATED FUNCTIONS

describe('Test NFT symbol', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
    dnsUnlock(new Args().serialize());
  });
  afterEach(() => {
    mockTransferredCoins(0);
    mockBalance(scAddress, 0);
    switchUser(owner);
  });
  test('Test NFT symbol', () => {
    expect(symbol()).toStrictEqual(stringToBytes('MNS'));
  });
});

describe('Test NFT balanceOf', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
    dnsUnlock(new Args().serialize());
  });
  afterEach(() => {
    mockTransferredCoins(0);
    mockBalance(scAddress, 0);
    switchUser(owner);
  });
  test('Test NFT balanceOf one elem', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    bytesToU256(dnsAlloc(args.serialize()));
    let argsBalance = new Args();
    argsBalance.add(owner);
    expect(bytesToU256(balanceOf(argsBalance.serialize()))).toStrictEqual(
      u256.One,
    );
  });
  test('Test NFT balanceOf multiple elems', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args.serialize());
    let args2 = new Args();
    args2.add('test256789');
    args2.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args2.serialize());
    let argsBalance = new Args();
    argsBalance.add(owner);
    expect(bytesToU256(balanceOf(argsBalance.serialize()))).toStrictEqual(
      u256.fromU32(2),
    );
  });
  test('No tokens owned', () => {
    let argsBalance = new Args();
    argsBalance.add(target);
    expect(bytesToU256(balanceOf(argsBalance.serialize()))).toStrictEqual(
      u256.Zero,
    );
  });
});

describe('Test NFT ownerOf', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
    dnsUnlock(new Args().serialize());
  });
  afterEach(() => {
    mockTransferredCoins(0);
    mockBalance(scAddress, 0);
    switchUser(owner);
  });
  test('Test NFT ownerOf', () => {
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    const tokenId = bytesToU256(dnsAlloc(args.serialize()));
    let argsOwner = new Args();
    argsOwner.add(tokenId);
    expect(ownerOf(argsOwner.serialize())).toStrictEqual(stringToBytes(owner));
  });
  throws('TokenId not found', () => {
    let argsOwner = new Args();
    argsOwner.add<u256>(u256.One);
    ownerOf(argsOwner.serialize());
  });
});

describe('Test NFT transferFrom', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
    dnsUnlock(new Args().serialize());
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args.serialize());
  });
  afterEach(() => {
    mockTransferredCoins(0);
    mockBalance(scAddress, 0);
    switchUser(owner);
  });
  test('Test NFT transferFrom success', () => {
    // check owned
    let filter = OWNED_TOKENS_KEY.concat(stringToBytes(owner));
    let keys = getKeys(filter);
    expect(keys.length).toStrictEqual(1);
    let tokenId = bytesToU256(
      nativeTypeArrayToBytes(keys[0].slice(filter.length)),
    );
    expect(tokenId).toStrictEqual(u256.Zero);

    let argsTransfer = new Args();
    argsTransfer.add(owner);
    argsTransfer.add(target);
    argsTransfer.add(tokenId);
    transferFrom(argsTransfer.serialize());
    let argsOwner = new Args();
    argsOwner.add(tokenId);
    expect(ownerOf(argsOwner.serialize())).toStrictEqual(stringToBytes(target));

    // check sender owned
    filter = OWNED_TOKENS_KEY.concat(stringToBytes(owner));
    keys = getKeys(filter);
    expect(keys.length).toStrictEqual(0);
    // check recipient owned
    filter = OWNED_TOKENS_KEY.concat(stringToBytes(target));
    keys = getKeys(filter);
    expect(keys.length).toStrictEqual(1);
    tokenId = bytesToU256(nativeTypeArrayToBytes(keys[0].slice(filter.length)));
    expect(tokenId).toStrictEqual(u256.Zero);
  });
  throws('Caller is not the owner', () => {
    let argsTransfer = new Args();
    argsTransfer.add(owner);
    argsTransfer.add(target);
    let tokenId = getTokenIdFromDomain(new Args().add(domain).serialize());
    argsTransfer.add(tokenId);
    switchUser(target);
    transferFrom(argsTransfer.serialize());
  });
  throws('TokenId not found', () => {
    let argsTransfer = new Args();
    argsTransfer.add(owner);
    argsTransfer.add(target);
    let tokenId = u256.fromU32(1);
    argsTransfer.add(tokenId);
    transferFrom(argsTransfer.serialize());
  });
});

describe('Test NFT approve', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
    dnsUnlock(new Args().serialize());
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args.serialize());
  });
  afterEach(() => {
    mockTransferredCoins(0);
    mockBalance(scAddress, 0);
    switchUser(owner);
  });
  test('Test NFT approve success', () => {
    // approve/transferFrom now reconcile storage cost with the caller; call them
    // without attaching coins (storage is free in the mock) so no refund is due.
    mockTransferredCoins(0);
    let argsApprove = new Args();
    argsApprove.add(target);
    let tokenId = bytesToU256(
      getTokenIdFromDomain(new Args().add(domain).serialize()),
    );
    argsApprove.add(tokenId);
    approve(argsApprove.serialize());
    switchUser(target);
    let argsTransfer = new Args();
    argsTransfer.add(owner);
    argsTransfer.add(target);
    argsTransfer.add(tokenId);
    let argsGetApproved = new Args();
    argsGetApproved.add(tokenId);
    expect(getApproved(argsGetApproved.serialize())).toStrictEqual(
      stringToBytes(target),
    );
    transferFrom(argsTransfer.serialize());
  });
  throws('Caller is not the owner', () => {
    let argsApprove = new Args();
    argsApprove.add(target);
    let tokenId = getTokenIdFromDomain(new Args().add(domain).serialize());
    argsApprove.add(tokenId);
    switchUser(target);
    approve(argsApprove.serialize());
  });
  throws('TokenId not found', () => {
    let argsApprove = new Args();
    argsApprove.add(target);
    let tokenId = u256.fromU32(1);
    argsApprove.add(tokenId);
    approve(argsApprove.serialize());
  });
});

describe('Test set Owner', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
    dnsUnlock(new Args().serialize());
  });
  afterEach(() => {
    switchUser(owner);
    mockTransferredCoins(0);
    mockBalance(scAddress, 0);
  });
  test('Test set Owner', () => {
    let args = new Args();
    args.add(owner);
    switchUser(owner);
    setOwner(args.serialize());
    let argsOwner = new Args();
    expect(ownerAddress(argsOwner.serialize())).toStrictEqual(
      stringToBytes(owner),
    );
  });
  throws('Caller is not the owner', () => {
    let args = new Args();
    args.add(owner);
    switchUser(target);
    setOwner(args.serialize());
  });
});

describe('Test setApprovalForAll', () => {
  beforeEach(() => {
    resetStorage();
    mockAdminContext(true);
    constructor(new Args().serialize());
    mockAdminContext(false);
    dnsUnlock(new Args().serialize());
    let args = new Args();
    args.add(domain);
    args.add(target);
    mockBalance(owner, transferredAmount);
    mockTransferredCoins(transferredAmount);
    mockBalance(scAddress, transferredAmount);
    dnsAlloc(args.serialize());
  });
  afterEach(() => {
    mockTransferredCoins(0);
    mockBalance(scAddress, 0);
    switchUser(owner);
  });
  test('Test setApprovalForAll', () => {
    // setApprovalForAll/transferFrom now reconcile storage cost with the caller;
    // call them without attaching coins (storage is free in the mock) so no
    // refund is due.
    mockTransferredCoins(0);
    let argsApprove = new Args();
    argsApprove.add(target);
    argsApprove.add(true);
    setApprovalForAll(argsApprove.serialize());
    let argsTransfer = new Args();
    switchUser(target);
    argsTransfer.add(owner);
    argsTransfer.add(target);
    let tokenId = bytesToU256(
      getTokenIdFromDomain(new Args().add(domain).serialize()),
    );
    argsTransfer.add(tokenId);
    const isApprovedForAllArgs = new Args();
    isApprovedForAllArgs.add(owner);
    isApprovedForAllArgs.add(target);
    expect(isApprovedForAll(isApprovedForAllArgs.serialize())).toStrictEqual(
      boolToByte(true),
    );
    transferFrom(argsTransfer.serialize());
  });
  throws('Caller is not the owner', () => {
    let argsApprove = new Args();
    argsApprove.add(target);
    argsApprove.add(true);
    switchUser(target);
    setApprovalForAll(argsApprove.serialize());
    let argsTransfer = new Args();
    argsTransfer.add(owner);
    argsTransfer.add(target);
    let tokenId = bytesToU256(
      getTokenIdFromDomain(new Args().add(domain).serialize()),
    );
    argsTransfer.add(tokenId);
    transferFrom(argsTransfer.serialize());
  });
});
