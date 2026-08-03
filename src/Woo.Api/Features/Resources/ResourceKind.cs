namespace Woo.Api.Features.Resources;

/// <summary>
/// The six universal resources of ordinary play. Named materials are contextual
/// and arrive only when they create a meaningful choice; they are not members
/// here.
/// </summary>
/// <remarks>
/// Persisted as a string, never as an ordinal — see
/// <c>WooDbContext.ConfigureConventions</c>.
/// </remarks>
public enum ResourceKind
{
    Gold,
    Provisions,
    Timber,
    Stone,
    Ore,

    /// <summary>
    /// Abstracts charcoal, nails, cloth, oils, rope, bindings, containers,
    /// ordinary hides, tools and maintenance inputs.
    /// </summary>
    WorkshopSupplies,
}
