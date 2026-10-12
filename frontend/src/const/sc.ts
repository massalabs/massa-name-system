import { Mas } from '@massalabs/massa-web3';

export const MAINNET_SC_ADDRESS = import.meta.env.VITE_MAINNET_SC_ADDRESS;
export const BUILDNET_SC_ADDRESS = import.meta.env.VITE_BUILDNET_SC_ADDRESS;

// Coins sent with calls that may create storage (target update, transfer).
// The contract keeps the storage cost and refunds the rest.
export const STORAGE_COINS = Mas.fromString('0.1');
