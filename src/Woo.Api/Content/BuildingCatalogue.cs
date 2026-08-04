using Woo.Api.Features.Resources;
using Woo.Api.Features.Settlements;

namespace Woo.Api.Content;

/// <summary>
/// The buildings an outpost can raise, with costs and durations.
/// </summary>
/// <remarks>
/// <para>
/// Starter content: deliberately small, readable, and meant to be thrown away
/// once playtesting says what the numbers should be. These values are a
/// starting point for balance, not a balance decision.
/// </para>
/// <para>
/// Canon shapes the costs. Arkazia is mountain country — iron-rich slopes,
/// stone-built towns — so Stone and Ore are the cheap inputs and Timber is the
/// pressure, which is what makes a Sylvaran timber trade worth having later.
/// </para>
/// </remarks>
public static class BuildingCatalogue
{
    public static IReadOnlyDictionary<BuildingKind, BuildingDefinition> Definitions { get; } =
        new Dictionary<BuildingKind, BuildingDefinition>
        {
            [BuildingKind.CommandHall] = new(
                BuildingKind.CommandHall,
                "Command Hall",
                "Where the settlement is run. Governance, reputation and standing.",
                ResourceCost.Of(
                    (ResourceKind.Timber, 120),
                    (ResourceKind.Stone, 80),
                    (ResourceKind.WorkshopSupplies, 40)),
                TimeSpan.FromMinutes(30)),

            [BuildingKind.Storehouse] = new(
                BuildingKind.Storehouse,
                "Storehouse",
                "Covered, guarded storage for the settlement's goods.",
                ResourceCost.Of(
                    (ResourceKind.Timber, 90),
                    (ResourceKind.Stone, 30),
                    (ResourceKind.WorkshopSupplies, 20)),
                TimeSpan.FromMinutes(20)),

            [BuildingKind.LumberYard] = new(
                BuildingKind.LumberYard,
                "Lumber Yard",
                "Felling and sawing for the alpine forests below the ridgeline.",
                ResourceCost.Of(
                    (ResourceKind.Timber, 40),
                    (ResourceKind.WorkshopSupplies, 30)),
                TimeSpan.FromMinutes(15)),

            [BuildingKind.Quarry] = new(
                BuildingKind.Quarry,
                "Quarry",
                "Cut stone from the mountainside — Arkazia builds in stone.",
                ResourceCost.Of(
                    (ResourceKind.Timber, 60),
                    (ResourceKind.WorkshopSupplies, 30)),
                TimeSpan.FromMinutes(20)),

            [BuildingKind.Mine] = new(
                BuildingKind.Mine,
                "Mine",
                "A shaft into the iron-rich slopes that make Arkazian steel possible.",
                ResourceCost.Of(
                    (ResourceKind.Timber, 80),
                    (ResourceKind.Stone, 40),
                    (ResourceKind.WorkshopSupplies, 40)),
                TimeSpan.FromMinutes(25)),
        };

    public static BuildingDefinition DefinitionOf(BuildingKind kind) => Definitions[kind];
}
