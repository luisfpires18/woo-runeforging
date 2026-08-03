using Woo.Api.Features.Resources;

namespace Woo.Api.Content;

/// <summary>
/// Display names for the six universal resources.
/// </summary>
/// <remarks>
/// Keyed by <see cref="ResourceKind"/> itself — there is no parallel string
/// identifier scheme, because nothing needs to resolve a resource by name yet.
/// Localisation replaces these strings when there is a second language.
/// </remarks>
public static class ResourceCatalogue
{
    public static IReadOnlyDictionary<ResourceKind, string> DisplayNames { get; } =
        new Dictionary<ResourceKind, string>
        {
            [ResourceKind.Gold] = "Gold",
            [ResourceKind.Provisions] = "Provisions",
            [ResourceKind.Timber] = "Timber",
            [ResourceKind.Stone] = "Stone",
            [ResourceKind.Ore] = "Ore",
            [ResourceKind.WorkshopSupplies] = "Workshop Supplies",
        };

    public static string DisplayNameOf(ResourceKind kind) => DisplayNames[kind];
}
