import { Check } from 'lucide-react';

export type QualityOption = {
  id: string;
  label: string;
  meta?: string;
  available: boolean;
};

type QualitySelectorProps = {
  options: QualityOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  busy?: boolean;
  legend?: string;
};

export function QualitySelector({ options, selectedId, onSelect, busy = false, legend = 'Quality options' }: QualitySelectorProps) {
  return (
    <fieldset className="rf-quality-fieldset" disabled={busy}>
      <legend className="rf-quality-label">{legend}</legend>
      <div className="rf-quality-list" role="radiogroup" aria-label={legend} aria-busy={busy}>
        {options.map((option) => {
          const selected = option.available && selectedId === option.id;
          return (
            <button
              type="button"
              key={option.id}
              className="rf-quality"
              role="radio"
              aria-checked={selected}
              disabled={!option.available || busy}
              onClick={() => onSelect(option.id)}
              data-testid={`button-quality-${option.id}`}
            >
              <span className="rf-quality-name">
                {selected && <Check size={13} aria-hidden="true" />}
                {option.label}
              </span>
              <small>{option.available ? option.meta || 'Available' : 'Unavailable'}</small>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
