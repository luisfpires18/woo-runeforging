import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  craftUnderWay,
  raiseTheForge,
  settledAs,
  withFinishedBatch,
} from '../../test/forgeFlows.ts';
import { renderPrimed, renderScenario } from '../../test/renderApp.tsx';

/**
 * The exclusive destination — the decision the whole craft exists to reach.
 *
 * A batch goes to one place, once, for good. That is enforced twice over: the
 * screen offers no options when there is no decision to make, and the source
 * refuses the command from any state but `AwaitingDestination`.
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

function goldHeld(): number {
  const bar = screen.getByRole('region', { name: /resources/i });
  const cell = within(bar).getByText('Gold').parentElement;

  return Number((cell?.textContent ?? '').replace(/\D/g, ''));
}

describe('The destination — choosing', () => {
  it('offers four, each with its consequence and the warning that it is final', async () => {
    window.history.pushState({}, '', '/forge/destination');
    await withFinishedBatch();

    await screen.findByRole('heading', { name: /where do the swords go/i, level: 1 });

    expect(screen.getByRole('radio', { name: /equip your own company/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /fulfil the kingdom contract/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /list them for sale/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /retain them/i })).toBeInTheDocument();

    // The consequences are stated before the choice, not after it.
    expect(screen.getByText(/the kingdom pays 400 gold/i)).toBeInTheDocument();
    expect(screen.getByText(/nothing is paid until a buyer takes them/i)).toBeInTheDocument();
    expect(
      screen.getByText(/one batch, one destination.*cannot be taken back/is),
    ).toBeInTheDocument();
  });

  it('offers no confirm until one is selected', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/forge/destination');
    await withFinishedBatch();

    await screen.findByRole('heading', { name: /where do the swords go/i, level: 1 });

    expect(screen.queryByRole('button', { name: /^confirm/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /retain them/i }));

    expect(await screen.findByRole('button', { name: /confirm — retain them/i })).toBeEnabled();
    expect(screen.getByText(/this cannot be undone/i)).toBeInTheDocument();
  });

  it('settles the batch, then becomes a record with no way to change it', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/forge/destination');
    await withFinishedBatch();

    await user.click(await screen.findByRole('radio', { name: /equip your own company/i }));
    await user.click(screen.getByRole('button', { name: /confirm — equip your own company/i }));

    // Confirmed in place: back at the forge, with the batch spoken for.
    expect(await screen.findByText(/set aside to arm your own company/i)).toBeInTheDocument();

    // Back to the address that made the decision. It is now a record: the
    // options are gone, and there is nothing to press.
    window.history.back();

    expect(await screen.findByRole('heading', { name: /no decision to make/i })).toBeInTheDocument();
    expect(screen.getByText(/it cannot be redirected/i)).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^confirm/i })).not.toBeInTheDocument();
  });

  it('disables the decision when offline, with the reason', async () => {
    offline();

    const user = userEvent.setup();
    window.history.pushState({}, '', '/forge/destination');
    await withFinishedBatch();

    await user.click(await screen.findByRole('radio', { name: /retain them/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirm — retain them/i })).toBeDisabled();
    });
    expect(
      screen.getByText(/nothing can be committed until the settlement answers/i),
    ).toBeInTheDocument();
  });
});

describe('The destination — what each one does', () => {
  it('pays the contract fee exactly once and records it', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/forge/destination');
    const { source } = await withFinishedBatch();

    // The HUD only carries balances once the settlement has loaded, so the
    // reading has to wait for the screen it is read from.
    await screen.findByRole('radio', { name: /fulfil the kingdom contract/i });
    const before = goldHeld();

    await user.click(screen.getByRole('radio', { name: /fulfil the kingdom contract/i }));
    await user.click(screen.getByRole('button', { name: /confirm — fulfil the kingdom contract/i }));

    await screen.findByText(/delivered to the kingdom for 400 gold/i);
    expect(goldHeld()).toBe(before + 400);

    // A second command cannot pay it again.
    await expect(source.chooseCraftDestination('craft-1', 'Contracted')).rejects.toThrow(
      /already gone/i,
    );

    const state = await source.load();
    expect(state.resources.find((balance) => balance.kind === 'Gold')?.amount).toBe(
      before + 400,
    );
    expect(state.forge.craft).toMatchObject({ destination: 'Contracted', feePaidGold: 400 });
  });

  /**
   * Listing records a price and pays nothing.
   *
   * There is no buyer and no market, and crediting Gold for an unsold batch
   * would be an infinite vendor — the one thing the economy is not allowed to
   * be.
   */
  it('records the asking price when listed, and credits no Gold', async () => {
    const user = userEvent.setup();
    window.history.pushState({}, '', '/forge/destination');
    const { source } = await withFinishedBatch();

    await screen.findByRole('radio', { name: /list them for sale/i });
    const before = goldHeld();

    await user.click(screen.getByRole('radio', { name: /list them for sale/i }));
    await user.click(screen.getByRole('button', { name: /confirm — list them for sale/i }));

    expect(await screen.findByText(/listed for sale at 320 gold/i)).toBeInTheDocument();
    expect(goldHeld()).toBe(before);

    // The price is kept, not merely displayed once.
    const state = await source.load();
    expect(state.forge.craft).toMatchObject({ destination: 'Listed', askingPriceGold: 320 });
    expect(state.resources.find((balance) => balance.kind === 'Gold')?.amount).toBe(before);
  });

  it('moves nothing when the batch is retained', async () => {
    const { source } = await settledAs('Retained')();

    const state = await source.load();

    expect(state.forge.craft).toMatchObject({ destination: 'Retained' });
    expect(state.forge.craft).not.toHaveProperty('feePaidGold');
    expect(state.forge.craft).not.toHaveProperty('askingPriceGold');
  });
});

describe('The destination — conflicting choices', () => {
  it('refuses a second, different destination and changes nothing', async () => {
    const { source } = await settledAs('Equipped')();

    await expect(source.chooseCraftDestination('craft-1', 'Listed')).rejects.toThrow(
      /already gone to your own company/i,
    );

    const state = await source.load();
    expect(state.forge.craft).toMatchObject({ destination: 'Equipped' });
  });

  it('refuses a repeat of the same destination too', async () => {
    const { source } = await settledAs('Retained')();

    await expect(source.chooseCraftDestination('craft-1', 'Retained')).rejects.toThrow(
      /already gone/i,
    );
  });

  /**
   * Two commands in flight at once.
   *
   * Both resolve elapsed time first, so they resume in order — the first
   * settles the batch, and the second finds a batch that has already gone. One
   * fulfils; the batch cannot reach two destinations.
   */
  it('lets exactly one of two concurrent commands through', async () => {
    const { source } = await withFinishedBatch();

    const results = await Promise.allSettled([
      source.chooseCraftDestination('craft-1', 'Equipped'),
      source.chooseCraftDestination('craft-1', 'Listed'),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);

    const state = await source.load();
    expect(state.forge.craft).toMatchObject({ status: 'Settled', destination: 'Equipped' });
  });

  it('refuses a command naming a craft the forge is not holding', async () => {
    const { source } = await withFinishedBatch();

    await expect(source.chooseCraftDestination('craft-9', 'Retained')).rejects.toThrow(
      /not the batch the forge is holding/i,
    );

    const state = await source.load();
    expect(state.forge.craft?.status).toBe('AwaitingDestination');
  });
});

describe('The destination — reached directly in every state', () => {
  it('says nothing has been forged when there is no craft', async () => {
    window.history.pushState({}, '', '/forge/destination');
    await renderPrimed(raiseTheForge)();

    expect(await screen.findByText(/nothing has been forged yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to the forge/i })).toBeInTheDocument();
  });

  it('sends the player to raise the Forge when there is not one', async () => {
    window.history.pushState({}, '', '/forge/destination');
    renderScenario('firstSession');

    expect(await screen.findByText(/nothing has been forged yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /raise the forge/i })).toBeInTheDocument();
  });

  it('says the swords are not finished, and offers no options', async () => {
    window.history.pushState({}, '', '/forge/destination');
    await renderPrimed(craftUnderWay)();

    expect(await screen.findByText(/not finished yet/i)).toBeInTheDocument();

    // No option can be chosen early, because none is rendered.
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^confirm/i })).not.toBeInTheDocument();
  });

  it('shows the decision as a record once it has been made, and offers no options', async () => {
    window.history.pushState({}, '', '/forge/destination');
    await settledAs('Listed')();

    expect(await screen.findByRole('heading', { name: /no decision to make/i })).toBeInTheDocument();
    expect(screen.getByText(/listed for sale at 320 gold/i)).toBeInTheDocument();
    expect(screen.getByText(/it cannot be redirected/i)).toBeInTheDocument();

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^confirm/i })).not.toBeInTheDocument();
  });
});

describe('The craft screen — reached directly in every state', () => {
  it('names the Forge as the requirement when there is none', async () => {
    window.history.pushState({}, '', '/forge/new');
    renderScenario('firstSession');

    expect(await screen.findByText(/settlement has no forge yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /begin the craft/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /raise the forge/i })).toBeInTheDocument();
  });

  it('says work is under way, and offers no confirm', async () => {
    window.history.pushState({}, '', '/forge/new');
    await renderPrimed(craftUnderWay)();

    expect(await screen.findByText(/already under way at the anvil/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /begin the craft/i })).not.toBeInTheDocument();
  });

  it('sends the player to the decision when a batch is waiting on one', async () => {
    window.history.pushState({}, '', '/forge/new');
    await withFinishedBatch();

    expect(await screen.findByText(/waiting on your decision/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /begin the craft/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /choose where they go/i })).toBeInTheDocument();
  });

  it('says the request has been answered once the batch has gone', async () => {
    window.history.pushState({}, '', '/forge/new');
    await settledAs('Contracted')();

    expect(await screen.findByText(/the request has been answered/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /begin the craft/i })).not.toBeInTheDocument();
  });
});
