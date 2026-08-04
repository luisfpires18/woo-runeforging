namespace Woo.Api.Features.Settlements;

/// <summary>
/// The buildings an outpost can raise.
/// </summary>
/// <remarks>
/// Barracks, Forge, Armoury and walls are part of Foundations of Iron, but each
/// exists to unlock a capability — recruitment, crafting, equipment storage,
/// defence — and none of those capabilities is modelled yet. They join the
/// prompts that give them something to do.
///
/// Persisted as a string, never as an ordinal. Renaming a member therefore
/// needs a migration for the stored values as well as the code — see
/// <c>MergeHouseIntoSettlement</c>, which carried <c>HouseHall</c> across to
/// <c>CommandHall</c>.
/// </remarks>
public enum BuildingKind
{
    /// <summary>Governance, reputation and the settlement's stage.</summary>
    CommandHall,

    /// <summary>Resource storage. Capacity itself arrives with Prompt 10.</summary>
    Storehouse,

    /// <summary>Timber processing.</summary>
    LumberYard,

    /// <summary>Stone and masonry.</summary>
    Quarry,

    /// <summary>Ore access — Arkazia's iron-rich slopes.</summary>
    Mine,
}
