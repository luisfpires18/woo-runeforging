using Woo.Api.Content;
using Woo.Api.Features.Houses;
using Woo.Api.Features.Resources;
using Woo.Api.Features.Settlements;

namespace Woo.Tests;

/// <summary>
/// Starter content is meant to be replaced, so these tests check that it is
/// complete and internally consistent rather than asserting particular numbers
/// — pinning the balance values here would make every balance change a test
/// change.
/// </summary>
public sealed class StarterContentTests
{
    [Fact]
    public void Every_resource_has_a_display_name()
    {
        Assert.All(Enum.GetValues<ResourceKind>(), kind =>
            Assert.False(string.IsNullOrWhiteSpace(ResourceCatalogue.DisplayNameOf(kind))));
    }

    [Fact]
    public void Every_building_has_a_definition()
    {
        Assert.All(Enum.GetValues<BuildingKind>(), kind =>
            Assert.Equal(kind, BuildingCatalogue.DefinitionOf(kind).Kind));
    }

    [Fact]
    public void Every_building_costs_something_and_takes_time()
    {
        Assert.All(BuildingCatalogue.Definitions.Values, definition =>
        {
            Assert.NotEmpty(definition.Cost.Entries);
            Assert.All(definition.Cost.Entries, entry => Assert.True(entry.Value > 0));
            Assert.True(definition.Duration > TimeSpan.Zero);
            Assert.False(string.IsNullOrWhiteSpace(definition.DisplayName));
        });
    }

    [Fact]
    public void Every_building_cost_names_a_real_resource()
    {
        var known = Enum.GetValues<ResourceKind>().ToHashSet();

        Assert.All(BuildingCatalogue.Definitions.Values, definition =>
            Assert.All(definition.Cost.Entries, entry => Assert.Contains(entry.Key, known)));
    }

    [Fact]
    public void The_starter_house_is_an_arkazian_outpost()
    {
        var house = StarterContent.EstablishStarterHouse(Guid.NewGuid(), Guid.NewGuid());

        Assert.Equal(Kingdom.Arkazia, house.Kingdom);
        Assert.Equal(SettlementStage.Outpost, house.Settlement.Stage);
        Assert.Equal(Enum.GetValues<BuildingKind>().Length, house.Settlement.Buildings.Count);
        Assert.All(house.Settlement.Buildings, building =>
            Assert.Equal(ConstructionStatus.NotBuilt, building.Status));
    }

    [Fact]
    public void The_opening_position_affords_any_first_building()
    {
        // There must always be a first move available, whichever the player picks.
        var house = StarterContent.EstablishStarterHouse(Guid.NewGuid(), Guid.NewGuid());

        Assert.All(BuildingCatalogue.Definitions.Values, definition =>
            Assert.True(
                house.Resources.CanAfford(definition.Cost),
                $"{definition.DisplayName} is unaffordable at the opening position."));
    }

    [Fact]
    public void The_opening_position_cannot_afford_every_building_at_once()
    {
        // ...but not all of them, or there would be no decision to make. This is
        // the property that makes the first session a choice rather than a
        // checklist.
        var house = StarterContent.EstablishStarterHouse(Guid.NewGuid(), Guid.NewGuid());

        var everything = BuildingCatalogue.Definitions.Values
            .SelectMany(definition => definition.Cost.Entries)
            .GroupBy(entry => entry.Key)
            .Select(group => (Kind: group.Key, Total: group.Sum(entry => entry.Value)))
            .ToArray();

        Assert.Contains(
            everything,
            entry => house.Resources.AmountOf(entry.Kind) < entry.Total);
    }
}
