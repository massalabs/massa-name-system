import { Accordion } from '@massalabs/react-ui-kit';
import { faqData } from '../const/faq';

export interface FAQData {
  question: string;
  answer: string;
}

export function FAQ() {
  return (
    <>
      <section className="mb-8">
        <p className="mas-title mb-2">FAQ</p>
      </section>
      {faqData.map((item, idx) => (
        <Accordion
          key={idx}
          customClass="bg-primary border-none rounded-xl p-1 mb-10"
          title={item.question}
        >
          <div className="p-5">
            <p className="mas-body">{item.answer}</p>
          </div>
        </Accordion>
      ))}
    </>
  );
}
