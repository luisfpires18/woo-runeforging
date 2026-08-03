import { forwardRef } from 'react';

import type { Building } from '../api/types.ts';
import { Art } from './Art.tsx';

/**
 * One building and its construction state.
 *
 * Status is carried by a glyph and a word as well as a colour, so the row stays
 * readable in greyscale (ACCESSIBILITY.md §3).
 */

const statusGlyph: Record<Building['status'], string> = {
  Complete: '■',
  UnderConstruction: '▨',
  NotBuilt: '□',
  Previewed: '□',
};

const statusLabel: Record<Building['status'], string> = {
  Complete: 'Complete',
  UnderConstruction: 'Under construction',
  NotBuilt: 'Not built',
  Previewed: 'Not yet available',
};

function minutesRemaining(building: Building, asOfUtc: string): number | null {
  if (building.completesAtUtc === null) {
    return null;
  }

  const remaining =
    new Date(building.completesAtUtc).getTime() - new Date(asOfUtc).getTime();

  return remaining <= 0 ? 0 : Math.ceil(remaining / 60_000);
}

export const BuildingRow = forwardRef<
  HTMLLIElement,
  { readonly building: Building; readonly asOfUtc: string; readonly highlighted?: boolean }
>(function BuildingRow({ building, asOfUtc, highlighted = false }, ref) {
  const remaining = minutesRemaining(building, asOfUtc);

  return (
    <li
      ref={ref}
      className={`building${highlighted ? ' building--highlighted' : ''}`}
      data-status={building.status}
      data-kind={building.kind}
      tabIndex={-1}
    >
      <Art assetKey={building.artKey} className="building__art" />

      <div className="building__body">
        <h3 className="building__name">
          <span aria-hidden="true" className="building__glyph">
            {statusGlyph[building.status]}
          </span>
          {building.displayName}
        </h3>

        <p className="building__status">{statusLabel[building.status]}</p>
        <p className="building__description">{building.description}</p>

        {building.status === 'UnderConstruction' && remaining !== null && (
          <p className="building__progress">
            <progress
              max={building.durationMinutes}
              value={building.durationMinutes - remaining}
              aria-label={`${building.displayName} construction progress`}
            />
            <span className="numeric">{remaining}</span> minutes left
          </p>
        )}

        {building.status === 'Complete' && building.yieldSummary !== null && (
          <p className="building__yield">{building.yieldSummary}</p>
        )}

        {building.unavailableReason !== null && (
          <p className="building__unavailable">{building.unavailableReason}</p>
        )}

        {(building.status === 'NotBuilt' || building.status === 'Previewed') && (
          <ul className="building__cost">
            {building.cost.map((entry) => (
              <li key={entry.kind}>
                <span className="numeric">{entry.amount}</span> {entry.kind === 'WorkshopSupplies' ? 'Supplies' : entry.kind}
              </li>
            ))}
            <li>
              <span className="numeric">{building.durationMinutes}</span> minutes
            </li>
          </ul>
        )}
      </div>
    </li>
  );
});
