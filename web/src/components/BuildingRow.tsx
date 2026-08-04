import { forwardRef } from 'react';

import type { Building } from '../api/types.ts';
import { Art } from './Art.tsx';
import { siteAnchor } from './SettlementScene.tsx';

/**
 * One site standing in the settlement, and its construction state.
 *
 * Status is carried by a glyph and a word as well as by the frame treatment, so
 * the plot stays readable in greyscale (ACCESSIBILITY.md §3). Selecting a plot
 * is a local, visual act: it changes which site the command ledge describes and
 * nothing else. No resources move, nothing is saved.
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
  {
    readonly building: Building;
    readonly asOfUtc: string;
    readonly selected?: boolean;
    readonly onSelect?: (kind: Building['kind']) => void;
  }
>(function BuildingRow({ building, asOfUtc, selected = false, onSelect }, ref) {
  const remaining = minutesRemaining(building, asOfUtc);

  return (
    <li
      ref={ref}
      className="plot"
      data-status={building.status}
      data-kind={building.kind}
      data-selected={selected ? 'true' : 'false'}
      style={siteAnchor(building.kind)}
      tabIndex={-1}
    >
      <span className="plot__frame">
        <Art assetKey={building.artKey} className="plot__art" />
        {/* Scaffolding: the construction overlay, drawn over the silhouette
            rather than shipped as a second file per state. */}
        <span aria-hidden="true" className="plot__scaffold" />
      </span>

      <h3 className="plot__name">
        <button
          type="button"
          className="plot__select"
          aria-pressed={selected}
          onClick={() => {
            onSelect?.(building.kind);
          }}
        >
          <span aria-hidden="true" className="plot__glyph">
            {statusGlyph[building.status]}
          </span>
          <span className="plot__label">{building.displayName}</span>
        </button>
      </h3>

      <p className="plot__status">{statusLabel[building.status]}</p>

      {building.status === 'UnderConstruction' && remaining !== null && (
        <p className="plot__progress">
          <progress
            max={building.durationMinutes}
            value={building.durationMinutes - remaining}
            aria-label={`${building.displayName} construction progress`}
          />
          <span className="numeric">{remaining}</span> minutes left
        </p>
      )}

      {building.status === 'Complete' && building.yieldSummary !== null && (
        <p className="plot__yield">{building.yieldSummary}</p>
      )}

      {building.unavailableReason !== null && (
        <p className="plot__unavailable">{building.unavailableReason}</p>
      )}
    </li>
  );
});
