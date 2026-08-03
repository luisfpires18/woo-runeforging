using Woo.Api.Features.Resources;
using Woo.Api.Features.Settlements;

namespace Woo.Api.Content;

/// <summary>
/// What a building costs and how long it takes.
/// </summary>
/// <remarks>
/// Prerequisites, construction slots, worker requirements and capability
/// effects arrive with authoritative construction (Prompt 11).
/// </remarks>
public sealed record BuildingDefinition(
    BuildingKind Kind,
    string DisplayName,
    string Description,
    ResourceCost Cost,
    TimeSpan Duration);
