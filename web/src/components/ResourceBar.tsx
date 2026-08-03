import type { ResourceBalance } from '../api/types.ts';

/**
 * The six balances, always visible.
 *
 * Every commitment spends resources, so the player must never navigate away to
 * find out whether they can afford something (NAVIGATION.md §2).
 */
export function ResourceBar({ resources }: { readonly resources: readonly ResourceBalance[] }) {
  return (
    <section className="resource-bar" aria-labelledby="resources-heading">
      <h2 id="resources-heading" className="visually-hidden">
        Resources
      </h2>
      <ul className="resource-bar__list">
        {resources.map((resource) => (
          <li key={resource.kind} className="resource-bar__item">
            <span className="resource-bar__name">{resource.displayName}</span>
            <span className="resource-bar__amount numeric">{resource.amount}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
