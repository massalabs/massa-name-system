import { useState } from 'react';
import { useMnsManagement } from '../hooks/useMnsManagement';
import { DnsUserEntryListResult } from '../utils/interface';
import { Address, BURN_ADDRESS } from '@massalabs/massa-web3';
import {
  Button,
  Input,
  PopupModal,
  PopupModalContent,
  PopupModalHeader,
  toast,
  Tooltip,
} from '@massalabs/react-ui-kit';

type UpdateOwnerModalProps = {
  isOpen: boolean;
  mns: DnsUserEntryListResult;
  owner: string;
  close: () => void;
};

export function UpdateOwnerModal({
  isOpen,
  mns,
  owner,
  close,
}: UpdateOwnerModalProps) {
  const [newOwnerAddress, setNewOwnerAddress] = useState<string>('');
  const [renounceOwnership, setRenounceOwnership] = useState<boolean>(false);
  const { changeOwnershipDnsEntry } = useMnsManagement();

  if (!isOpen) return null;

  const onSave = async () => {
    try {
      if (!renounceOwnership) Address.fromString(newOwnerAddress);
    } catch (e) {
      toast.error('Invalid owner address');
      close();
      return;
    }

    changeOwnershipDnsEntry({
      currentOwner: owner,
      newOwner: renounceOwnership ? BURN_ADDRESS : newOwnerAddress,
      domain: mns.domain,
    });
    close();
  };

  const title = `Transfer ownership of ${mns.domain}.massa`;
  const tooltip = 'Transfer ownership to burn address';

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <PopupModal onClose={close}>
        <PopupModalHeader customClassHeader="mb-8">
          <h2 className="mas-h2">{title}</h2>
        </PopupModalHeader>
        <PopupModalContent>
          <Tooltip body={<p className="mas-body">{tooltip}</p>}>
            <div className="relative flex flex-row pb-2">
              <p className="mas-body pr-4">Renounce ownership</p>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={renounceOwnership}
                  onChange={(e) => setRenounceOwnership(e.target.checked)}
                  className="sr-only peer"
                />
                <div
                  className={`w-11 h-6 after:h-5 after:w-5 after:top-0.5 after:left-0.5 bg-c-disabled-1
                                  rounded-full peer
                                  peer-checked:bg-brand peer-checked:border-red-500 peer-checked:border
                                  peer-checked:after:bg-red-500 peer-checked:after:translate-x-full
                                  after:content-[''] after:absolute after:bg-primary
                                  after:rounded-full after:transition-all`}
                ></div>
              </label>
            </div>
          </Tooltip>
          {!renounceOwnership && (
            <div className="pb-2">
              <p className="mas-body pb-2">Enter Address</p>
              <Input
                customClass="w-96 border-none mb-8"
                placeholder={owner}
                onChange={(e) => setNewOwnerAddress(e.target.value)}
                disabled={renounceOwnership}
              />
            </div>
          )}

          <div className="flex flex-row-reverse pb-12">
            <div className="w-32">
              <Button onClick={onSave}>
                <div>Save</div>
              </Button>
            </div>
          </div>
        </PopupModalContent>
      </PopupModal>
    </div>
  );
}
