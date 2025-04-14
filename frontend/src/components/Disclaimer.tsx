import { PopupModal, PopupModalContent, Button } from '@massalabs/react-ui-kit';
import { useDisclaimer } from '@massalabs/react-ui-kit';

interface Doc {
  title: string;
  link: string;
}

interface DisclaimerProps {
  title?: string;
  description?: string;
  acceptText?: string;
  docs: Doc[];
}

export function Disclaimer(props: DisclaimerProps) {
  let { isValid, accept } = useDisclaimer({ docs: props.docs });

  return (
    <>
      {!isValid && (
        <PopupModal
          customClass="flex justify-center text-neutral"
          customClassNested="w-1/2 py-10"
          fullMode={true}
        >
          <PopupModalContent>
            <div className=" flex flex-col justify-center gap-4">
              <div className="mas-title text-neutral">
                {props.title || 'Terms of Service'}
              </div>
              {props.description && <p>{props.description}</p>}
              {props.docs.map((doc, index) => (
                <div key={index}>
                  <a href={doc.link} target="_blank">
                    <u>{doc.title}</u>
                  </a>
                </div>
              ))}
              <Button onClick={() => accept()}>
                {props.acceptText || 'Accept'}
              </Button>
            </div>
          </PopupModalContent>
        </PopupModal>
      )}
    </>
  );
}
