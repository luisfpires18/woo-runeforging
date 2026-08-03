namespace Woo.Api.Features.Settlements;

/// <summary>
/// Where a building is in its one-way construction lifecycle:
/// <c>NotBuilt → UnderConstruction → Complete</c>.
/// </summary>
/// <remarks>
/// Cancellation, demolition and upgrade tiers are later prompts. There is no
/// transition out of <see cref="Complete"/>.
///
/// Persisted as a string, never as an ordinal.
/// </remarks>
public enum ConstructionStatus
{
    NotBuilt,
    UnderConstruction,
    Complete,
}
