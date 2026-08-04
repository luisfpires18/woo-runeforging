import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ForgeCraft } from '../../api/types.ts';
import {
  finishedBatch,
  hardenedOrder,
  raiseTheForge,
  standardOrder,
  withCraftUnderWay,
  withFinishedBatch,
  withForge,
  withReadyForge,
} from '../../test/forgeFlows.ts';
import { renderPrimed, renderScenario } from '../../test/renderApp.tsx';

/**
 * The ordinary forging loop — the forging half of Prompt 6.
 *
 * `src/test/setup.ts` rejects every fetch, which makes the app offline, which
 * is right for the rest of the suite — but offline deliberately disables
 * committing. These tests stub a *successful* platform probe instead, still with
 * no network and no non-determinism, and the offline cases re-reject it.
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

function rail() {
  return within(screen.getByRole('navigation', { name: 'Areas' }));
}

function goldHeld(): number {
  const bar = screen.getByRole('region', { name: /resources/i });
  const cell = within(bar).getByText('Gold').parentElement;

  return Number((cell?.textContent ?? '').replace(/\D/g, ''));
}

function ore(): number {
  const bar = screen.getByRole('region', { name: /resources/i });
  const cell = within(bar).getByText('Ore').parentElement;

  return Number((cell?.textContent ?? '').replace(/\D/g, ''));
}

/**
 * The guard that matters most in this feature.
 *
 * Ordinary forging has a floor and no hidden roll, and the copy must not borrow
 * the vocabulary of one. This is what makes the eventual Runeforging risk panel
 * land as a change in kind rather than as more of the same — so it is checked
 * mechanically, over whatever is on screen, rather than left to a reviewer's eye.
 *
 * `%` is included: the batch's condition is a number in the data and a word on
 * the screen, precisely so that no rate is ever printed here.
 */
function expectNoProbabilityLanguage() {
  const text = document.body.textContent;

  expect(text).not.toMatch(/%/);
  expect(text).not.toMatch(/\bchance\b/i);
  expect(text).not.toMatch(/\bodds\b/i);
  expect(text).not.toMatch(/\brisk\b/i);
  expect(text).not.toMatch(/\broll\b/i);
  expect(text).not.toMatch(/\bprobabilit/i);
  expect(text).not.toMatch(/\blikelihood\b/i);
}

// ---------------------------------------------------------------------------

describe('The forge — the model', () => {
  it('cannot express a craft that is in two places, or finished without a batch', () => {
    const base = {
      id: 'craft-1',
      order: standardOrder,
      cost: [],
      durationMinutes: 45,
      qualityFloor: 'Serviceable',
      startedAtUtc: '2026-08-03T12:00:00.000Z',
      completesAtUtc: '2026-08-03T12:45:00.000Z',
    } as const;

    const batch = {
      id: 'batch-craft-1',
      patternName: 'Arkazian infantry sword',
      quantity: 100,
      quality: 'Serviceable',
      conditionPercent: 100,
      equipmentEffect: 'Reliable in the line, and easy to replace.',
      equipmentEffectTier: 1,
      maker: {
        smithName: 'Halvard Stenn',
        smithMastery: 'Weaponsmith',
        settlementName: 'Arkazian Outpost',
        forgedAtUtc: '2026-08-03T12:45:00.000Z',
        patternId: standardOrder.patternId,
        gradeId: standardOrder.gradeId,
        techniqueId: standardOrder.techniqueId,
        contentVersion: '2026.08.1',
        rulesVersion: 'forge-ordinary-1',
      },
    } as const;

    // A batch that was equipped cannot also carry an asking price: the field
    // exists only on the member that can have it.
    const equipped: ForgeCraft = {
      ...base,
      status: 'Settled',
      batch,
      destination: 'Equipped',
      destinationChosenAtUtc: '2026-08-03T12:46:00.000Z',
      // @ts-expect-error an equipped batch has no asking price
      askingPriceGold: 320,
    };

    // Work still at the anvil cannot have produced anything.
    // @ts-expect-error an unfinished craft has no batch
    const running: ForgeCraft = { ...base, status: 'InProgress', batch };

    expect(equipped.status).toBe('Settled');
    expect(running.status).toBe('InProgress');
  });
});

describe('The forge — availability', () => {
  it('is absent from the rail while the building does not stand', async () => {
    renderScenario('firstSession');

    await screen.findByRole('heading', { level: 1 });

    // Absent, not disabled. A greyed-out tab teases a system the player cannot
    // reach and cannot yet work toward.
    expect(rail().queryByRole('link', { name: 'Forge' })).not.toBeInTheDocument();
  });

  it('appears in the rail once the Forge is complete', async () => {
    await withForge();

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    await waitFor(() => {
      expect(rail().getByRole('link', { name: 'Forge' })).toBeInTheDocument();
    });
  });

  it('states why there is nothing to forge when reached early, and offers no craft', async () => {
    window.history.pushState({}, '', '/forge');
    renderScenario('firstSession');

    expect(await screen.findByText(/no forge yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /begin a project/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /raise the forge/i })).toBeInTheDocument();
  });

  it('says an unknown forge address is not there, without crashing', async () => {
    window.history.pushState({}, '', '/forge/bellows');
    renderScenario('firstSession');

    expect(
      await screen.findByRole('heading', { name: /no such place in the forge/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to the forge/i })).toBeInTheDocument();
  });
});

describe('The forge — the request', () => {
  it('says who needs the swords, why, how many, and what it pays', async () => {
    window.history.pushState({}, '', '/forge');
    await withForge();

    const request = await screen.findByRole('region', { name: /kingdom request/i });

    expect(within(request).getByText(/100 infantry swords/i)).toBeInTheDocument();
    // Canon: Red Bastion is the barracks, Bastion the unit it raises.
    expect(request).toHaveTextContent(/Bastion company attached to the Red Bastion/i);
    expect(request).toHaveTextContent(/holds the far end of the pass/i);
    expect(request).toHaveTextContent('400');
    expect(request).toHaveTextContent(/within three days/i);
  });
});

describe('The forge — choosing, before committing', () => {
  it('changes cost, duration, quality and effect as the technique changes', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/forge/new');
    await withForge();

    await screen.findByRole('heading', { name: /forge the swords/i, level: 1 });

    // Standard: 80 Ore, 45 minutes, Serviceable.
    expect(screen.getByText(/quality/i).parentElement).toHaveTextContent(/serviceable/i);
    expect(screen.getByText(/duration/i).parentElement).toHaveTextContent('45');

    await user.click(screen.getByRole('radio', { name: /hardened edge/i }));

    // Hardened: dearer, slower, and a better floor. Every number moves.
    await waitFor(() => {
      expect(screen.getByText(/quality/i).parentElement).toHaveTextContent(/fine/i);
    });
    expect(screen.getByText(/duration/i).parentElement).toHaveTextContent('68');
    expect(screen.getByText(/in the line/i).parentElement).toHaveTextContent(
      /holds an edge through a longer engagement/i,
    );

    await user.click(screen.getByRole('radio', { name: /quick turnaround/i }));

    await waitFor(() => {
      expect(screen.getByText(/duration/i).parentElement).toHaveTextContent('27');
    });
    expect(screen.getByText(/quality/i).parentElement).toHaveTextContent(/serviceable/i);
  });

  it('shows Steel with its reason and does not let it be chosen', async () => {
    window.history.pushState({}, '', '/forge/new');
    await withForge();

    const steel = await screen.findByRole('radio', { name: /steel/i });

    expect(steel).toBeDisabled();
    expect(screen.getByText(/needs a furnace/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /iron/i })).toBeEnabled();
  });

  it('states the quality as guaranteed and names the destination decision', async () => {
    window.history.pushState({}, '', '/forge/new');
    // Stores topped up, so the confirm is present rather than replaced by a
    // shortfall — the non-cancellable boundary belongs beside the confirm.
    await withReadyForge();

    await screen.findByRole('heading', { name: /forge the swords/i, level: 1 });

    expect(screen.getByText(/guaranteed/i)).toBeInTheDocument();
    expect(
      screen.getByText(/you will choose one destination for them, and that choice is final/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/once begun, this cannot be cancelled/i)).toBeInTheDocument();
  });

  it('uses no probability vocabulary on the craft form, whichever technique is chosen', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/forge/new');
    await withForge();

    await screen.findByRole('heading', { name: /forge the swords/i, level: 1 });

    for (const technique of [/hardened edge/i, /quick turnaround/i, /standard pattern/i]) {
      await user.click(screen.getByRole('radio', { name: technique }));

      expectNoProbabilityLanguage();
    }
  });

  it.each([
    ['the forge holding a finished batch', '/forge'],
    ['the destination decision', '/forge/destination'],
  ])('uses no probability vocabulary on %s', async (_name, path) => {
    window.history.pushState({}, '', path);
    await withFinishedBatch();

    await screen.findByRole('heading', { level: 1 });

    expectNoProbabilityLanguage();
  });

  it('names the smith and lets the work be assigned to him', async () => {
    window.history.pushState({}, '', '/forge/new');
    await withForge();

    const smith = await screen.findByRole('radio', { name: /halvard stenn, weaponsmith/i });

    expect(smith).toBeEnabled();
    expect(smith).toBeChecked();
  });
});

describe('The forge — an unavailable smith', () => {
  /**
   * Primed unavailable **before** anything is forged.
   *
   * A smith who is busy at the anvil only ever proves that a second craft is
   * refused, which is a different rule. This is the case where the specialist
   * simply cannot take the work.
   */
  it('offers no confirm, and says why', async () => {
    window.history.pushState({}, '', '/forge/new');
    renderScenario('smithUnavailable');

    expect(
      await screen.findByRole('heading', { name: /cannot take this on/i, level: 1 }),
    ).toBeInTheDocument();

    // The reason is stated where the confirm would have been, and again beside
    // the smith it is about.
    expect(screen.getAllByText(/assigned to the pass forges at obsidia/i).length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByRole('button', { name: /begin the craft/i })).not.toBeInTheDocument();
  });

  it('refuses the command even when it is called anyway', async () => {
    const { source } = renderScenario('smithUnavailable');

    await expect(source.beginCraft(standardOrder)).rejects.toThrow(/cannot take the work/i);
  });

  it('still shows the terms, so the player can see what the work would take', async () => {
    window.history.pushState({}, '', '/forge/new');
    renderScenario('smithUnavailable');

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByText(/guaranteed/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /standard pattern/i })).toBeDisabled();
  });
});

describe('The forge — committing', () => {
  it('spends the whole cost once and starts the work', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/forge/new');
    await withReadyForge();

    await screen.findByRole('heading', { name: /forge the swords/i, level: 1 });
    const before = ore();

    await user.click(screen.getByRole('button', { name: /begin the craft/i }));

    // Success is confirmed in place: back at the forge, with the work under way
    // and the stores down.
    expect(await screen.findByText(/being forged/i)).toBeInTheDocument();
    expect(ore()).toBe(before - 80);
  });

  it('cannot be confirmed twice, and spends nothing more', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/forge/new');
    await withReadyForge();

    await screen.findByRole('heading', { name: /forge the swords/i, level: 1 });
    await user.click(screen.getByRole('button', { name: /begin the craft/i }));

    await screen.findByText(/being forged/i);
    const after = ore();

    // Back to the same address. There is nothing to press: the anvil is busy,
    // and the screen says so rather than going quiet.
    window.history.back();

    expect(await screen.findByText(/already under way at the anvil/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /begin the craft/i })).not.toBeInTheDocument();
    expect(ore()).toBe(after);
  });

  it('returns to the forge on cancel, having spent nothing', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/forge/new');
    await withForge();

    await screen.findByRole('heading', { name: /forge the swords/i, level: 1 });
    const before = ore();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(await screen.findByRole('region', { name: /kingdom request/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/forge');
    expect(ore()).toBe(before);
  });

  it('leaves on Escape, having spent nothing', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/forge/new');
    await withForge();

    await screen.findByRole('heading', { name: /forge the swords/i, level: 1 });
    const before = ore();

    await user.keyboard('{Escape}');

    expect(await screen.findByRole('region', { name: /kingdom request/i })).toBeInTheDocument();
    expect(ore()).toBe(before);
  });

  it('disables the craft when offline, with the reason', async () => {
    offline();

    window.history.pushState({}, '', '/forge/new');
    await withReadyForge();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /begin the craft/i })).toBeDisabled();
    });
    expect(
      screen.getByText(/nothing can be committed until the settlement answers/i),
    ).toBeInTheDocument();
  });
});

describe('The forge — shortages', () => {
  it('replaces the confirm with the exact shortfall, its price and what is left', async () => {
    window.history.pushState({}, '', '/forge/new');
    await withForge();

    // Raising the Command Hall and the Forge leaves the settlement short of Ore.
    const notice = await screen.findByText(/^short/i);

    expect(notice).toHaveTextContent('Ore');
    expect(screen.getByText(/procuring costs/i)).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /begin the craft/i })).not.toBeInTheDocument();
  });

  it('buys every shortfall at once, and the confirm returns', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/forge/new');
    await withForge();

    await user.click(await screen.findByRole('button', { name: /procure the shortfall/i }));

    expect(await screen.findByRole('button', { name: /begin the craft/i })).toBeEnabled();
    expect(screen.queryByText(/^short/i)).not.toBeInTheDocument();
  });

  it('never reports Gold as a shortfall', async () => {
    window.history.pushState({}, '', '/forge/new');
    await withForge();

    const notice = await screen.findByText(/^short/i);

    expect(notice).not.toHaveTextContent(/gold/i);
  });

  it('disables procuring when offline, with the reason', async () => {
    offline();

    window.history.pushState({}, '', '/forge/new');
    await withForge();

    expect(await screen.findByRole('button', { name: /procure the shortfall/i })).toBeDisabled();
    expect(screen.getByText(/procuring needs the settlement to answer/i)).toBeInTheDocument();
  });
});

describe('The forge — completing', () => {
  it('finishes on the next read, mints the batch and records it once', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/forge');
    await withCraftUnderWay();

    expect(await screen.findByText(/being forged/i)).toBeInTheDocument();

    // The standard pattern takes 45 minutes, so three 20-minute steps carry it.
    for (let step = 0; step < 3; step += 1) {
      await user.click(screen.getByRole('button', { name: /advance 20 minutes/i }));
    }

    expect(await screen.findByText(/waiting on your decision|one place only/i)).toBeInTheDocument();

    // The batch carries its maker from the moment it exists.
    const maker = await screen.findByRole('heading', { name: /maker/i });
    expect(maker.parentElement).toHaveTextContent('Halvard Stenn');

    await user.click(rail().getByRole('link', { name: 'Outpost' }));

    const changed = await screen.findByRole('region', { name: /what changed/i });
    const finished = within(changed).getAllByText(/finished 100 infantry swords/i);

    expect(finished).toHaveLength(1);
  });

  it('cannot complete twice, however far the clock runs', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/forge');
    await withCraftUnderWay();

    await screen.findByText(/being forged/i);

    for (let step = 0; step < 8; step += 1) {
      await user.click(screen.getByRole('button', { name: /advance 20 minutes/i }));
    }

    await user.click(rail().getByRole('link', { name: 'Outpost' }));

    const changed = await screen.findByRole('region', { name: /what changed/i });

    expect(within(changed).getAllByText(/finished 100 infantry swords/i)).toHaveLength(1);
  });

  it('puts the waiting batch under what needs attention, as a link', async () => {
    window.history.pushState({}, '', '/');
    await withFinishedBatch();

    const attention = await screen.findByRole('region', { name: /needs attention/i });
    const link = within(attention).getByRole('link', {
      name: /finished and waiting on your decision/i,
    });

    expect(link).toHaveAttribute('href', '/forge/destination');
  });
});

describe('The forge — one craft, and an inert deadline', () => {
  /**
   * The deadline is checked where the passing of time cannot be mistaken for
   * ordinary progress: **before** anything is forged, and **after** the batch
   * has settled. Advancing three days with a craft in flight would legitimately
   * finish it, and the completion would mask what is being asserted.
   */
  it('changes nothing when three days pass before any craft', async () => {
    window.history.pushState({}, '', '/forge');
    const { source } = await renderPrimed(async (settlement) => {
      await raiseTheForge(settlement);
      // Well past the three days the kingdom asked for, and nothing has been
      // forged. If the deadline meant anything, this is where it would show.
      settlement.advance(4 * 24 * 60);
    })();

    const request = await screen.findByRole('region', { name: /kingdom request/i });

    expect(request).toHaveTextContent('400');
    expect(request).toHaveTextContent(/within three days/i);

    // Nothing has expired, nothing is overdue, and nothing is counting down.
    const text = document.body.textContent;
    expect(text).not.toMatch(/expired|overdue|too late|missed the deadline|penalt/i);

    // And the work can still be begun, on the same terms.
    expect(screen.getByRole('link', { name: /begin a project/i })).toBeInTheDocument();

    const state = await source.load();
    expect(state.forge.request.feeGold).toBe(400);
    expect(state.forge.craft).toBeNull();
  });

  it('changes nothing when three days pass after the batch has settled', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/forge');
    await renderPrimed(async (settlement) => {
      await finishedBatch(settlement);
      await settlement.send('craft-1', 'Retained');
      // Three days, in one step.
      settlement.advance(3 * 24 * 60);
    })();

    expect(await screen.findByText(/held in the settlement, unpromised/i)).toBeInTheDocument();

    const goldBefore = goldHeld();

    await user.click(screen.getByRole('button', { name: /advance 20 minutes/i }));

    expect(await screen.findByText(/held in the settlement, unpromised/i)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /kingdom request/i })).toHaveTextContent('400');
    expect(goldHeld()).toBe(goldBefore);

    const text = document.body.textContent;
    expect(text).not.toMatch(/expired|overdue|too late|missed the deadline|penalt/i);
  });

  it('will not start a second craft once the request has been answered', async () => {
    window.history.pushState({}, '', '/forge');
    const { source } = await renderPrimed(async (settlement) => {
      await raiseTheForge(settlement);
      await settlement.procureCraft(standardOrder);
      await settlement.craft(standardOrder);
      settlement.advance(45);
      await settlement.send('craft-1', 'Retained');
    })();

    expect(
      await screen.findByText(/the request has been answered/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /begin a project/i })).not.toBeInTheDocument();

    // The stored batch is what a second craft would destroy, so the source
    // refuses one however it is reached.
    await expect(source.beginCraft(hardenedOrder)).rejects.toThrow(/has been answered/i);

    const state = await source.load();
    expect(state.forge.craft?.batch?.quality).toBe('Serviceable');
  });
});

describe('The forge — deterministic output', () => {
  it.each([
    ['technique.standard', 'Serviceable'],
    ['technique.hardened', 'Fine'],
    ['technique.quick', 'Serviceable'],
  ])('gives %s exactly its guaranteed floor, %s', async (techniqueId, expected) => {
    const { source } = await renderPrimed(async (settlement) => {
      const order = { ...standardOrder, techniqueId };
      await raiseTheForge(settlement);
      await settlement.procureCraft(order);
      await settlement.craft(order);
      settlement.advance(120);
    })();

    const state = await source.load();
    const craft = state.forge.craft;

    expect(craft?.qualityFloor).toBe(expected);
    // Exactly the floor. Nothing lands above it, because there is nothing above
    // it to land on.
    expect(craft?.batch?.quality).toBe(expected);
  });

  it('produces an identical batch from an identical order', async () => {
    const build = renderPrimed(async (settlement) => {
      await raiseTheForge(settlement);
      await settlement.procureCraft(hardenedOrder);
      await settlement.craft(hardenedOrder);
      settlement.advance(120);
    });

    const first = (await (await build()).source.load()).forge.craft?.batch;
    const second = (await (await build()).source.load()).forge.craft?.batch;

    expect(first).toEqual(second);
    expect(first?.conditionPercent).toBe(100);
    expect(first?.equipmentEffectTier).toBe(2);
    expect(first?.equipmentEffect).toMatch(/holds an edge/i);
  });
});

describe('The forge — provenance', () => {
  it('shows who made it, from what, and under which versions — in names', async () => {
    window.history.pushState({}, '', '/forge');
    await withFinishedBatch();

    const maker = await screen.findByRole('heading', { name: /maker/i });
    const list = maker.parentElement;

    expect(list).toHaveTextContent('Halvard Stenn');
    expect(list).toHaveTextContent('Weaponsmith');
    expect(list).toHaveTextContent('Arkazian Outpost');
    expect(list).toHaveTextContent('Arkazian infantry sword');
    expect(list).toHaveTextContent('Iron');
    expect(list).toHaveTextContent('Standard pattern');
    expect(list).toHaveTextContent('2026.08.1');
    expect(list).toHaveTextContent('forge-ordinary-1');

    // Identifiers are what later systems reconstruct a craft from. They are not
    // what a player reads: an id on screen is codebase jargon.
    expect(list).not.toHaveTextContent('pattern.sword');
    expect(list).not.toHaveTextContent('grade.iron');
    expect(list).not.toHaveTextContent('technique.standard');
  });

  it('still stores the identifiers on the batch, for later systems', async () => {
    const { source } = await withFinishedBatch();
    const state = await source.load();

    expect(state.forge.craft?.batch?.maker).toMatchObject({
      patternId: 'pattern.sword.infantry.arkazian',
      gradeId: 'grade.iron',
      techniqueId: 'technique.standard',
      contentVersion: '2026.08.1',
      rulesVersion: 'forge-ordinary-1',
    });
  });
});
