import { Accordion, Spinner, useAccountStore } from '@massalabs/react-ui-kit';
import { useEffect, useState } from 'react';
import { useMnsStore } from '../store/mnsStore';
import { useMnsManagement } from '../hooks/useMnsManagement';
import { MnsItem } from './MnsItem';
import { UpdateTargetModal } from './UpdateTargetModal';
import { UpdateOwnerModal } from './UpdateOwnerModal';
import { useMnsList } from '../hooks/useMnsList';
import { DnsUserEntryListResult } from '../utils/interface';

export function MNSList() {
  const { connectedAccount } = useAccountStore();
  const [domainToUpdate, setDomainToUpdate] = useState<
    DnsUserEntryListResult | undefined
  >();
  const [ownershipModalOpen, setOwnershipModalOpen] = useState<boolean>(false);
  const [updateTargetModalOpen, setTargetModalOpen] = useState<boolean>(false);

  const { deleteDnsEntry, isPending } = useMnsManagement();
  const { getUserDomains } = useMnsList();

  const { listSpinning, list, mnsContract } = useMnsStore();

  const onUpdateTarget = (domain: DnsUserEntryListResult) => {
    setDomainToUpdate(domain);
    setTargetModalOpen(true);
  };

  const onUpdateOwnership = (domain: DnsUserEntryListResult) => {
    setDomainToUpdate(domain);
    setOwnershipModalOpen(true);
  };

  useEffect(() => {
    if (!mnsContract || !connectedAccount) return;
    getUserDomains(connectedAccount.address);
  }, [mnsContract, connectedAccount, getUserDomains]);

  if (!connectedAccount) {
    return null;
  }

  return (
    <div>
      <Accordion
        customClass="border-none"
        title={listSpinning ? 'Fetching...' : `Owned MNS  (${list.length})`}
      >
        {listSpinning ? (
          <div className="flex items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div>
            <UpdateTargetModal
              isOpen={updateTargetModalOpen}
              close={() => setTargetModalOpen(false)}
              mns={domainToUpdate!}
            />
            <UpdateOwnerModal
              isOpen={ownershipModalOpen}
              close={() => setOwnershipModalOpen(false)}
              mns={domainToUpdate!}
              owner={connectedAccount.address}
            />

            {list.length === 0 ? (
              <div className="flex items-center justify-center">
                <p className="mas-body">No MNS found</p>
              </div>
            ) : (
              list.map((item, idx) => (
                <MnsItem
                  key={idx}
                  item={item}
                  isPending={isPending}
                  onUpdateTarget={() => onUpdateTarget(item)}
                  onUpdateOwnership={() => onUpdateOwnership(item)}
                  onDelete={() => deleteDnsEntry(item.domain)}
                />
              ))
            )}
          </div>
        )}
      </Accordion>
    </div>
  );
}
