import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderScenario } from '../../test/renderApp.tsx';

async function goToSettlement(user: ReturnType<typeof userEvent.setup>) {
  const link = await screen.findByRole('link', { name: 'Settlement' });
  await user.click(link);
  return screen.findByRole('region', { name: /buildings/i });
}

describe('Settlement', () => {
  it('lists all seven buildings, with Barracks and Forge previewed and their reason given', async () => {
    const user = userEvent.setup();
    renderScenario('firstSession');

    const buildings = await goToSettlement(user);

    expect(within(buildings).getAllByRole('heading', { level: 3 })).toHaveLength(7);

    for (const kind of ['Barracks', 'Forge']) {
      const row = document.querySelector(`[data-kind="${kind}"]`);
      expect(row).toHaveAttribute('data-status', 'Previewed');
      expect(within(row as HTMLElement).getByText(/needs the house hall/i)).toBeInTheDocument();
    }
  });

  it('falls back to the heraldic token when a building has no art', async () => {
    const user = userEvent.setup();
    renderScenario('firstSession');

    await goToSettlement(user);

    // buildings/forge.svg is deliberately absent, so this exercises the real
    // fallback chain rather than a simulated one.
    const forgeArt = document.querySelector('[data-asset-key="buildings/forge"]');
    expect(forgeArt).toHaveAttribute('data-fallback', 'true');
    expect(forgeArt).toHaveAttribute('src');

    // A building that does have art resolves without falling back.
    const quarryArt = document.querySelector('[data-asset-key="buildings/quarry"]');
    expect(quarryArt).toHaveAttribute('data-fallback', 'false');
  });

  it('shows a completed production site and what it yields', async () => {
    const user = userEvent.setup();
    const { source } = renderScenario('returningConstruction');

    await goToSettlement(user);

    const row = () => document.querySelector('[data-kind="LumberYard"]');
    expect(row()).toHaveAttribute('data-status', 'UnderConstruction');

    // Time moves through the source and the provider reloads — the same path a
    // refetch against a real endpoint will take.
    source.advance(20);
    await user.click(screen.getByRole('button', { name: /advance 20 minutes/i }));

    await waitFor(() => {
      expect(row()).toHaveAttribute('data-status', 'Complete');
    });

    expect(
      within(row() as HTMLElement).getByText(/timber, steadily, from the slopes below/i),
    ).toBeInTheDocument();
  });
});
