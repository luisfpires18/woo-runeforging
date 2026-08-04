import type { Person } from '../../api/types.ts';
import { Art } from '../../components/Art.tsx';
import { EmptyRegion } from '../../components/StateRegion.tsx';

/**
 * The people of the House. The player meets the smith here.
 *
 * He is idle: there is no forge yet, and the interface says so plainly rather
 * than offering a control that would do nothing.
 */
export function Household({ people }: { readonly people: readonly Person[] }) {
  return (
    <section aria-labelledby="household-heading" className="record">
      <h2 id="household-heading" className="record__heading">
        The household
      </h2>

      {people.length === 0 ? (
        <EmptyRegion>
          <p>No one has taken service with the House yet.</p>
        </EmptyRegion>
      ) : (
        <ul className="household">
          {people.map((person) => (
            <li key={person.id} className="person">
              {/* Portraits go straight to the heraldic token: a picture of a
                  fortress is not a picture of a person. */}
              <Art
                assetKey={person.portraitKey}
                className="person__portrait"
                factionFallback={false}
              />
              <div>
                <h3 className="person__name">{person.name}</h3>
                <p className="person__role">{person.role}</p>
                <p className="person__introduction">{person.introduction}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
