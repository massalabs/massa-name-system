import {
  toast,
  useAccountStore,
  useHandleOperation,
} from '@massalabs/react-ui-kit';

import { useMnsStore } from '../store/mnsStore';
import { DnsTransferParams } from '../utils/interface';
import { useMnsList } from './useMnsList';
import {
  DELETE_OP_MESSAGE,
  UPDATE_OWNER_OP_MESSAGE,
  UPDATE_TARGET_OP_MESSAGE,
} from '../const/operationMessages';
import { STORAGE_COINS } from '../const/sc';

export function useMnsManagement() {
  const { setMnsContract, mnsContract } = useMnsStore();
  const { handleOperation, isPending } = useHandleOperation();
  const { getUserDomains } = useMnsList();
  const { connectedAccount: provider, refreshBalance } = useAccountStore();

  async function deleteDnsEntry(name: string) {
    if (!provider) return;

    try {
      const operation = await mnsContract.free(name);
      await handleOperation(operation, DELETE_OP_MESSAGE);
      await getUserDomains(provider.address);
      refreshBalance(false);
    } catch (error) {
      console.log(error);
      toast.error('Failed to delete Dns Entry');
    }
  }

  async function changeTargetAddressDnsEntry(
    domain: string,
    targetAddress: string,
  ) {
    if (!provider) return;
    try {
      const operation = await mnsContract.updateTarget(domain, targetAddress, {
        coins: STORAGE_COINS,
      });
      await handleOperation(operation, UPDATE_TARGET_OP_MESSAGE);
      await getUserDomains(provider.address);
      refreshBalance(false);
    } catch (error) {
      console.log(error);
      toast.error('Failed to update Target Address');
    }
  }

  async function changeOwnershipDnsEntry({
    currentOwner,
    newOwner,
    domain,
  }: DnsTransferParams) {
    if (!provider) return;
    try {
      const operation = await mnsContract.transferFrom(
        domain,
        currentOwner,
        newOwner,
        { coins: STORAGE_COINS },
      );
      await handleOperation(operation, UPDATE_OWNER_OP_MESSAGE);
      getUserDomains(provider.address);
      refreshBalance(false);
    } catch (error) {
      console.log(error);
      toast.error('Failed to transfer ownership');
    }
  }

  return {
    isPending,
    changeOwnershipDnsEntry,
    deleteDnsEntry,
    changeTargetAddressDnsEntry,
    setMnsContract,
  };
}
