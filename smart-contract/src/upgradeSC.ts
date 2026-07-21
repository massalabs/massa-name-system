import { SmartContract, Mas, Operation, rpcTypes } from '@massalabs/massa-web3';
import { getScByteCode, initProvider } from './utils';
import { MNS_CONTRACT } from './config';

const provider = await initProvider();

const byteCode = getScByteCode('build', 'main.wasm');
const contract = new SmartContract(provider, MNS_CONTRACT);

console.log(
  'Contract balance before upgrade:',
  Mas.toString(await provider.client.getBalance(MNS_CONTRACT)),
);

const op: Operation = await contract.call('upgradeSC', byteCode, {
  coins: Mas.fromString('3'),
  fee: Mas.fromString('0.1'),
});

const events: rpcTypes.OutputEvents = await op.getFinalEvents();

for (const event of events) {
  console.log('upgradeSC Events:', event.data);
}

console.log('upgradeSC done ! operation:', op.id);

console.log(
  'Contract balance after upgrade:',
  Mas.toString(await provider.client.getBalance(MNS_CONTRACT)),
);
