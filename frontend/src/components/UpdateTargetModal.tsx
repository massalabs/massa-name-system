import { useState } from 'react';
import { useMnsManagement } from '../hooks/useMnsManagement';
import { DnsUserEntryListResult } from '../utils/interface';
import {
  Button,
  Input,
  PopupModal,
  PopupModalContent,
  PopupModalHeader,
} from '@massalabs/react-ui-kit';

type UpdateTargetModalProps = {
  isOpen: boolean;
  mns: DnsUserEntryListResult;
  close: () => void;
};

export function UpdateTargetModal({
  isOpen,
  mns,
  close,
}: UpdateTargetModalProps) {
  const [newTargetAddress, setNewTargetAddress] = useState<string>('');

  const { changeTargetAddressDnsEntry } = useMnsManagement();

  if (!isOpen) return null;

  const onSave = async () => {
    changeTargetAddressDnsEntry(mns.domain, newTargetAddress);
    close();
  };

  const title = `Change target address of ${mns.domain}.massa`;

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <PopupModal onClose={close}>
        <PopupModalHeader customClassHeader="mb-8">
          <h2 className="mas-h2">{title}</h2>
        </PopupModalHeader>
        <PopupModalContent>
          <p className="mas-body pb-2">Enter Address</p>
          <Input
            customClass="w-96 border-none mb-8"
            placeholder={mns.targetAddress}
            onChange={(e) => setNewTargetAddress(e.target.value)}
          />
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
