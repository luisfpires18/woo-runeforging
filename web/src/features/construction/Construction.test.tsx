import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderPrimed, renderScenario } from '../../test/renderApp.tsx';

/**
 * The construction commit flow — Prompt 6, the construction half.
 *
 * `src/test/setup.ts` rejects every fetch, which is right for the rest of the
 * suite: with no backend the app is offline, and that is the honest default.
 * But offline deliberately disables committing, so these tests stub a
 * *successful* platform probe instead — still no network, still deterministic —
 * and the offline case re-rejects it explicitly.
 */
function online() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () =>
          Promise.resolve({
            application: 'Weapons of Chaos and Order',
            environment: 'Test',
            utcNow: '2026-08-03T12:00:00Z',
            database: { connected: true },
          }),
      }),
    ),
  );
}

function offline() {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('No backend during tests.'))),
  );
}

beforeEach(online);

/** The nav rail. The confirm screen also has a breadcrumb link to Settlement. */
function rail() {
  return within(screen.getByRole('navigation', { name: 'Areas' }));
}

function goTo(user: ReturnType<typeof userEvent.setup>, area: 'Outpost' | 'Settlement') {
  return user.click(rail().getByRole('link', { name: area }));
}

/** Outpost → settlement (Lumber Yard focused) → the confirm screen. */
async function goToLumberYardConfirm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: /raise the lumber yard/i }));
  await user.click(await screen.findByRole('link', { name: /raise the lumber yard/i }));

  return screen.findByRole('heading', { name: /raise the lumber yard/i, level: 1 });
}

function plot(kind: string) {
  return document.querySelector(`[data-kind="${kind}"]`);
}

function timber(): number {
  const bar = screen.getByRole('region', { name: /resources/i });
  const cell = within(bar).getByText('Timber').parentElement;

  return Number((cell?.textContent ?? '').replace(/\D/g, ''));
}

describe('Construction — the confirm screen', () => {
  it('states the cost, what it leaves, when it finishes, and that it cannot be undone', async () => {
    const user = userEvent.setup();
    renderScenario('firstSession');

    await goToLumberYardConfirm(user);

    // Cost beside the balance it leaves — the "after" column is the point.
    const terms = screen.getByRole('table');
    const row = within(terms).getByRole('row', { name: /timber/i });

    expect(within(row).getByText('40')).toBeInTheDocument();
    expect(within(row).getByText('220')).toBeInTheDocument();
    expect(within(row).getByText('180')).toBeInTheDocument();

    // The completion time, not only the duration.
    expect(screen.getByText(/complete at/i)).toHaveTextContent('12:15');

    expect(screen.getByText(/once begun, this cannot be cancelled/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /begin construction/i })).toBeEnabled();
  });

  it('spends exactly once and starts the work', async () => {
    const user = userEvent.setup();
    renderScenario('firstSession');

    await goToLumberYardConfirm(user);
    expect(timber()).toBe(220);

    await user.click(screen.getByRole('button', { name: /begin construction/i }));

    // Success is confirmed in place: back at the settlement, the plot has moved
    // on and the resource strip has dropped.
    await waitFor(() => {
      expect(plot('LumberYard')).toHaveAttribute('data-status', 'UnderConstruction');
    });

    expect(timber()).toBe(180);
  });

  it('cannot be confirmed twice, and spends nothing more', async () => {
    const user = userEvent.setup();
    renderScenario('firstSession');

    await goToLumberYardConfirm(user);
    await user.click(screen.getByRole('button', { name: /begin construction/i }));

    await waitFor(() => {
      expect(plot('LumberYard')).toHaveAttribute('data-status', 'UnderConstruction');
    });
    expect(timber()).toBe(180);

    // Back to the same address. There is nothing to press: the site is no
    // longer raisable, and the screen says so rather than going quiet.
    window.history.back();

    expect(await screen.findByText(/already under way/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /begin construction/i }),
    ).not.toBeInTheDocument();

    // The one spend stands; a second was never possible to make.
    expect(timber()).toBe(180);
  });

  it('returns to the settlement on cancel, having spent nothing', async () => {
    const user = userEvent.setup();
    renderScenario('firstSession');

    await goToLumberYardConfirm(user);
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await screen.findByRole('region', { name: /buildings/i });

    expect(window.location.pathname).toBe('/settlement');
    expect(plot('LumberYard')).toHaveAttribute('data-status', 'NotBuilt');
    expect(timber()).toBe(220);

    // Focus returns to the plot the player was deciding about.
    await waitFor(() => {
      expect(plot('LumberYard')).toHaveFocus();
    });
  });

  it('disables both commands when offline, with the reason', async () => {
    offline();

    const user = userEvent.setup();
    renderScenario('firstSession');

    await goToLumberYardConfirm(user);

    // The shell's offline banner is the live region; the confirm carries the
    // reason beside the control it disables.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /begin construction/i })).toBeDisabled();
    });
    expect(
      screen.getByText(/nothing can be committed until the settlement answers/i),
    ).toBeInTheDocument();
  });
});

describe('Construction — shortages', () => {
  /**
   * Spends the site down until the Mine cannot be afforded. Every step is a
   * real command, so the shortage is one the settlement could actually reach.
   */
  const spentDown = renderPrimed(async (settlement) => {
    await settlement.begin('CommandHall');
    await settlement.begin('LumberYard');
    await settlement.begin('Quarry');
  });

  it('replaces the confirm with the exact shortfall, its price and what is left', async () => {
    const user = userEvent.setup();
    await spentDown();

    await goTo(user, 'Settlement');
    await user.click(await screen.findByRole('button', { name: 'Mine' }));
    await user.click(await screen.findByRole('link', { name: /raise the mine/i }));

    // Short 80 Timber and 40 Supplies at 1 Gold a unit.
    const notice = await screen.findByText(/^short/i);

    expect(notice).toHaveTextContent('80');
    expect(notice).toHaveTextContent('Timber');
    expect(notice).toHaveTextContent('40');
    expect(notice).toHaveTextContent('Workshop Supplies');

    expect(screen.getByText(/procuring costs/i)).toHaveTextContent('120');
    expect(screen.getByText(/procuring costs/i)).toHaveTextContent('130');

    // The shortfall replaces the confirm; it never sits beside a disabled one.
    expect(
      screen.queryByRole('button', { name: /begin construction/i }),
    ).not.toBeInTheDocument();
  });

  it('buys every shortfall at once, and the confirm returns', async () => {
    const user = userEvent.setup();
    await spentDown();

    await goTo(user, 'Settlement');
    await user.click(await screen.findByRole('button', { name: 'Mine' }));
    await user.click(await screen.findByRole('link', { name: /raise the mine/i }));

    await user.click(await screen.findByRole('button', { name: /procure the shortfall/i }));

    expect(await screen.findByRole('button', { name: /begin construction/i })).toBeEnabled();
    expect(screen.queryByText(/^short/i)).not.toBeInTheDocument();
  });

  it('disables procuring when offline, with the reason', async () => {
    offline();

    const user = userEvent.setup();
    await spentDown();

    await goTo(user, 'Settlement');
    await user.click(await screen.findByRole('button', { name: 'Mine' }));
    await user.click(await screen.findByRole('link', { name: /raise the mine/i }));

    expect(await screen.findByRole('button', { name: /procure the shortfall/i })).toBeDisabled();
    expect(screen.getByText(/procuring needs the settlement to answer/i)).toBeInTheDocument();
  });
});

describe('Construction — sites that cannot be raised', () => {
  it('says an unknown site is not there, without crashing', async () => {
    window.history.pushState({}, '', '/settlement/hanging-gardens');
    renderScenario('firstSession');

    expect(await screen.findByRole('heading', { name: /no such site/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /begin construction/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to the settlement/i })).toBeInTheDocument();
  });

  it('says a previewed site is not yet reachable, and offers no confirm', async () => {
    window.history.pushState({}, '', '/settlement/barracks');
    renderScenario('firstSession');

    expect(await screen.findByText(/needs the command hall/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /begin construction/i }),
    ).not.toBeInTheDocument();
  });

  it('says work is already under way, and offers no confirm', async () => {
    window.history.pushState({}, '', '/settlement/lumber-yard');
    renderScenario('returningConstruction');

    expect(await screen.findByText(/already under way/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /begin construction/i }),
    ).not.toBeInTheDocument();
  });

  it('says a completed site is already standing, and offers no confirm', async () => {
    window.history.pushState({}, '', '/settlement/lumber-yard');
    renderScenario('returningConstruction');

    await screen.findByRole('heading', { level: 1 });
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /advance 20 minutes/i }));

    expect(await screen.findByText(/already standing/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /begin construction/i }),
    ).not.toBeInTheDocument();
  });
});

describe('Construction — completion', () => {
  it('completes on the next read and appears under what changed', async () => {
    const user = userEvent.setup();
    renderScenario('firstSession');

    await goToLumberYardConfirm(user);
    await user.click(screen.getByRole('button', { name: /begin construction/i }));

    await waitFor(() => {
      expect(plot('LumberYard')).toHaveAttribute('data-status', 'UnderConstruction');
    });

    // The Lumber Yard takes 15 minutes, so one 20-minute step is enough.
    await user.click(screen.getByRole('button', { name: /advance 20 minutes/i }));

    await waitFor(() => {
      expect(plot('LumberYard')).toHaveAttribute('data-status', 'Complete');
    });

    await goTo(user, 'Outpost');

    const changed = await screen.findByRole('region', { name: /what changed/i });
    expect(within(changed).getByText(/the lumber yard is finished/i)).toBeInTheDocument();
  });
});

describe('Construction — the Command Hall unlocks Barracks and Forge', () => {
  const withCommandHall = renderPrimed(async (settlement) => {
    await settlement.begin('CommandHall');
    settlement.advance(30);
  });

  it('turns both previews into sites that can be raised', async () => {
    const user = userEvent.setup();
    await withCommandHall();

    await goTo(user, 'Settlement');

    await waitFor(() => {
      expect(plot('CommandHall')).toHaveAttribute('data-status', 'Complete');
    });

    for (const kind of ['Barracks', 'Forge']) {
      expect(plot(kind)).toHaveAttribute('data-status', 'NotBuilt');
    }
  });

  it('sends both through the same confirmation flow', async () => {
    const user = userEvent.setup();
    await withCommandHall();

    await goTo(user, 'Settlement');
    await waitFor(() => {
      expect(plot('Forge')).toHaveAttribute('data-status', 'NotBuilt');
    });

    await user.click(screen.getByRole('button', { name: 'Forge' }));
    await user.click(await screen.findByRole('link', { name: /raise the forge/i }));

    expect(
      await screen.findByRole('heading', { name: /raise the forge/i, level: 1 }),
    ).toBeInTheDocument();

    // Raising the Command Hall spent most of the stone, so the Forge arrives
    // short — the same shortfall path as any other site, resolved the same way.
    await user.click(await screen.findByRole('button', { name: /procure the shortfall/i }));

    expect(
      await screen.findByRole('button', { name: /begin construction/i }),
    ).toBeEnabled();
    expect(screen.getByText(/once begun, this cannot be cancelled/i)).toBeInTheDocument();
  });

  it('completing the Forge introduces no forging, and the Barracks no recruitment', async () => {
    const user = userEvent.setup();
    await renderPrimed(async (settlement) => {
      await settlement.begin('CommandHall');
      settlement.advance(30);
      await settlement.procure('Forge');
      await settlement.begin('Forge');
      settlement.advance(40);
      await settlement.procure('Barracks');
      await settlement.begin('Barracks');
      settlement.advance(45);
    })();

    await goTo(user, 'Settlement');

    await waitFor(() => {
      expect(plot('Forge')).toHaveAttribute('data-status', 'Complete');
    });
    expect(plot('Barracks')).toHaveAttribute('data-status', 'Complete');

    // A standing Forge is a standing building and nothing else. Crafting,
    // patterns, techniques and the smith's work are the forging half, and a
    // completed building must not quietly advertise them.
    for (const forbidden of [/craft/i, /pattern/i, /technique/i, /forge a /i, /smith at work/i]) {
      expect(screen.queryByRole('button', { name: forbidden })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: forbidden })).not.toBeInTheDocument();
    }

    // The same for the Barracks and recruitment, which is Prompt 7.
    for (const forbidden of [/recruit/i, /company/i, /train/i, /muster/i]) {
      expect(screen.queryByRole('button', { name: forbidden })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: forbidden })).not.toBeInTheDocument();
    }
  });
});

describe('Construction — telemetry', () => {
  it('reports each transition once, and no more', async () => {
    const user = userEvent.setup();
    const { sink } = renderScenario('firstSession');

    await goToLumberYardConfirm(user);
    await user.click(screen.getByRole('button', { name: /begin construction/i }));

    await waitFor(() => {
      expect(plot('LumberYard')).toHaveAttribute('data-status', 'UnderConstruction');
    });

    expect(sink.namesOf('construction.confirmed')).toHaveLength(1);
    expect(sink.namesOf('construction.first')).toHaveLength(1);

    const first = sink.namesOf('construction.first')[0];
    expect(first).toMatchObject({ kind: 'LumberYard' });
    expect(first).toHaveProperty('elapsedMs', expect.any(Number));

    await user.click(screen.getByRole('button', { name: /advance 20 minutes/i }));
    await waitFor(() => {
      expect(plot('LumberYard')).toHaveAttribute('data-status', 'Complete');
    });

    // Reload repeatedly. A completion is observed on every read after it
    // happens, and must still be reported exactly once.
    await goTo(user, 'Outpost');
    await goTo(user, 'Settlement');
    await user.click(screen.getByRole('button', { name: /advance 20 minutes/i }));

    await waitFor(() => {
      expect(sink.namesOf('construction.completed')).toHaveLength(1);
    });

    expect(sink.namesOf('construction.confirmed')).toHaveLength(1);
    expect(sink.namesOf('construction.first')).toHaveLength(1);
  });

  it('reports a shortage once however many times it is rendered, then its purchase', async () => {
    const user = userEvent.setup();
    const { sink } = await renderPrimed(async (settlement) => {
      await settlement.begin('CommandHall');
      await settlement.begin('LumberYard');
      await settlement.begin('Quarry');
    })();

    await goTo(user, 'Settlement');
    await user.click(await screen.findByRole('button', { name: 'Mine' }));
    await user.click(await screen.findByRole('link', { name: /raise the mine/i }));

    await screen.findByText(/^short/i);
    expect(sink.namesOf('shortage.shown')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /procure the shortfall/i }));
    await screen.findByRole('button', { name: /begin construction/i });

    expect(sink.namesOf('shortage.procured')).toHaveLength(1);
    expect(sink.namesOf('shortage.shown')).toHaveLength(1);
  });

  it('records where the player left when they cancel', async () => {
    const user = userEvent.setup();
    const { sink } = renderScenario('firstSession');

    await goToLumberYardConfirm(user);
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await screen.findByRole('region', { name: /buildings/i });

    const abandoned = sink.namesOf('construction.abandoned');
    expect(abandoned).toHaveLength(1);
    expect(abandoned[0]).toMatchObject({ kind: 'LumberYard', at: 'cancelled' });
  });
});
