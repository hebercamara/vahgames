import React from 'react';
import { Link } from 'react-router-dom';

// Moldura comum das páginas de jogo (DESIGN.md): canvas escuro, botão de voltar em pílula,
// título em caixa alta e área principal centralizada.
export default function GamePage({ title, actions, children }) {
  return (
    <div className="min-h-screen bg-canvas px-4 pb-10 pt-4 md:px-8">
      <header className="mx-auto mb-6 flex max-w-6xl items-center justify-between gap-3">
        <Link to="/" className="btn-ghost shrink-0 px-4" aria-label="Voltar ao VAH Games">
          <span aria-hidden="true">←</span>
          <span className="hidden sm:inline">VAH Games</span>
        </Link>
        <h1 className="heading min-w-0 truncate text-[18px] sm:text-heading-sm">{title}</h1>
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      </header>
      <main className="mx-auto max-w-6xl">{children}</main>
    </div>
  );
}

// Grupo de opções em pílula (segmented control)
export function Segmented({ label, value, options, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-caption uppercase text-muted">{label}</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={`btn px-4 ${active ? 'bg-lime text-lime-ink' : 'bg-white/10 text-ink hover:bg-white/20'}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
