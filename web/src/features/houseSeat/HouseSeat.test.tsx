import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  FailingSource,
  NeverResolvingSource,
  renderApp,
  renderScenario,
} from '../../test/renderApp.tsx';

/** The filled primary button, whatever it currently says. */
function primaryButtons(): HTMLElement[] {
  return screen
    .queryAllByRole('button')
    .filter((button) => button.classList.contains('button--primary'));
}

describe('House Seat — first session', () => {
  it('offers exactly one primary action, and it names the Lumber Yard', async () => {
    renderScenario('firstSession');

    await screen.findByRole('heading', { name: /ashen reach/i, level: 1 });

    const primaries = primaryButtons();
    expect(primaries).toHaveLength(1);
    expect(primaries[0]).toHaveAccessibleName(/raise the lumber yard/i);
  });

  it('shows all six resources', async () => {
    renderScenario('firstSession');

    await screen.findByRole('heading', { name: /ashen reach/i, level: 1 });

    // Scoped to the resource bar: several of these names also appear in
    // building costs elsewhere on the screen.
    const bar = screen.getByRole('region', { name: /resources/i });

    for (const name of ['Gold', 'Provisions', 'Timber', 'Stone', 'Ore', 'Workshop Supplies']) {
      expect(within(bar).getByText(name)).toBeInTheDocument();
    }

    // Quantities use tabular figures so a column of numbers aligns.
    expect(within(bar).getByText('220')).toHaveClass('numeric');
  });

  it('lists all seven buildings on the site, including the two previewed', async () => {
    renderScenario('firstSession');

    const site = await screen.findByRole('region', { name: /the site/i });

    for (const name of [
      'House Hall',
      'Storehouse',
      'Lumber Yard',
      'Quarry',
      'Mine',
      'Barracks',
      'Forge',
    ]) {
      expect(within(site).getByText(name)).toBeInTheDocument();
    }
  });

  it('hints at runes in prose without offering any rune control', async () => {
    renderScenario('firstSession');

    await screen.findByText(/marked before arkazia had a name/i);

    // No rune inventory, no odds, no Runeforging button — not even a disabled
    // one, because a disabled control is an advertisement.
    expect(screen.queryByRole('button', { name: /rune/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('introduces the smith', async () => {
    renderScenario('firstSession');

    const household = await screen.findByRole('region', { name: /the household/i });
    expect(within(household).getByText('Halvard Stenn')).toBeInTheDocument();
  });

  it('never tells the player that content is invented or replaceable', async () => {
    renderScenario('firstSession');

    await screen.findByRole('heading', { name: /ashen reach/i, level: 1 });

    for (const leak of [/placeholder/i, /invented/i, /replaceable/i, /sample data/i, /mock/i]) {
      expect(screen.queryByText(leak)).not.toBeInTheDocument();
    }
  });
});

describe('House Seat — the primary action', () => {
  it('navigates to the settlement and focuses the Lumber Yard, without starting construction', async () => {
    const user = userEvent.setup();
    renderScenario('firstSession');

    const button = await screen.findByRole('button', { name: /raise the lumber yard/i });
    await user.click(button);

    const heading = await screen.findByRole('heading', { name: /ashen reach — outpost/i });
    expect(heading).toBeInTheDocument();
    expect(window.location.pathname).toBe('/settlement');

    const row = document.querySelector('[data-kind="LumberYard"]');
    await waitFor(() => {
      expect(row).toHaveFocus();
    });

    // Nothing was committed: the building is still unbuilt and the balance is
    // untouched. Committing resources is Prompt 6.
    expect(row).toHaveAttribute('data-status', 'NotBuilt');
    expect(screen.getByText('220')).toBeInTheDocument();
  });
});

describe('House Seat — returning session', () => {
  it('answers what changed and what needs attention, with attention items as links', async () => {
    renderScenario('returningConstruction');

    const changed = await screen.findByRole('region', { name: /what changed/i });
    expect(within(changed).getByText(/work began on the lumber yard/i)).toBeInTheDocument();

    const attention = screen.getByRole('region', { name: /needs attention/i });
    const link = within(attention).getByRole('link', { name: /still under construction/i });
    expect(link).toHaveAttribute('href', '/settlement');
  });
});

describe('House Seat — states without a primary action', () => {
  it('loading shows a busy placeholder and no primary action', async () => {
    renderApp(new NeverResolvingSource());

    const region = screen.getByText(/reading word from the house/i).closest('.state');
    expect(region).toHaveAttribute('aria-busy', 'true');

    // The connectivity probe settles after the synchronous render and sets
    // state. Await its visible result rather than asserting past it — otherwise
    // that update lands outside act() and React rightly complains.
    await screen.findByRole('status');

    // Still loading, and still no primary action: nothing is known yet, so
    // there is nothing to offer.
    expect(screen.getByText(/reading word from the house/i)).toBeInTheDocument();
    expect(primaryButtons()).toHaveLength(0);
  });

  it('error offers a retry, not a next move', async () => {
    renderApp(new FailingSource());

    const alert = await screen.findByRole('alert');
    expect(within(alert).getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(primaryButtons()).toHaveLength(0);
  });

  it('empty regions read as empty, not as an error', async () => {
    // The empty scenario, so this asserts a rendered empty state rather than
    // the absence of a section.
    renderScenario('empty');

    const household = await screen.findByRole('region', { name: /the household/i });

    const message = within(household).getByText(/no one has taken service with the house yet/i);
    expect(message).toBeInTheDocument();

    // Empty is not an error: no alert, and none of the danger styling.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(message.closest('.state')).toHaveClass('state--empty');
  });
});
