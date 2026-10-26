import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FaqItem } from '@/content/site';

export function FaqAccordion({ items, defaultIndex = null, idPrefix = 'faq' }: { items: FaqItem[]; defaultIndex?: number | null; idPrefix?: string }) {
  const reactId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(defaultIndex);

  return (
    <div className="rf-faq-list">
      {items.map((item, index) => {
        const open = openIndex === index;
        const buttonId = `${reactId}-${idPrefix}-button-${index}`;
        const panelId = `${reactId}-${idPrefix}-panel-${index}`;
        return (
          <div className="rf-faq-item" key={item.question}>
            <h3 className="rf-faq-heading">
              <button
                id={buttonId}
                className="rf-faq-question"
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
                data-testid={`${idPrefix}-question-${index}`}
              >
                <span>{item.question}</span>
                <ChevronDown size={18} aria-hidden="true" className={open ? 'rf-chevron open' : 'rf-chevron'} />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!open} className="rf-faq-answer">
              <p>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
