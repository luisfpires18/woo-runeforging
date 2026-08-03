using Woo.Api.Content;
using Woo.Api.Features.Houses;
using Woo.Api.Features.Resources;
using Woo.Api.Features.Settlements;

namespace Woo.Tests;

/// <summary>
/// The first-slice rule: <b>a construction cannot complete twice</b> — and it
/// cannot complete before it is due.
/// </summary>
/// <remarks>
/// Every test drives time by passing it in. Nothing here sleeps, and nothing
/// reads a clock: a construction that takes thirty minutes is completed by
/// handing the domain a timestamp thirty minutes later.
/// </remarks>
public sealed class ConstructionRuleTests
{
    private static readonly DateTimeOffset Noon =
        new(2026, 8, 3, 12, 0, 0, TimeSpan.Zero);

    private static House WealthyHouse() =>
        House.Establish(
            Guid.NewGuid(),
            "House Under Test",
            Kingdom.Arkazia,
            Settlement.FoundOutpost(Guid.NewGuid(), "Test Reach"),
            ResourcePool.With(
                (ResourceKind.Gold, 10_000),
                (ResourceKind.Provisions, 10_000),
                (ResourceKind.Timber, 10_000),
                (ResourceKind.Stone, 10_000),
                (ResourceKind.Ore, 10_000),
                (ResourceKind.WorkshopSupplies, 10_000)));

    private static (House House, TimeSpan Duration) StartStorehouse()
    {
        var house = WealthyHouse();
        var definition = BuildingCatalogue.DefinitionOf(BuildingKind.Storehouse);

        house.BeginConstruction(BuildingKind.Storehouse, definition.Cost, definition.Duration, Noon);

        return (house, definition.Duration);
    }

    [Fact]
    public void A_construction_cannot_complete_twice()
    {
        var (house, duration) = StartStorehouse();
        var due = Noon + duration;

        house.CompleteConstruction(BuildingKind.Storehouse, due);

        var error = Assert.Throws<InvalidConstructionStateException>(
            () => house.CompleteConstruction(BuildingKind.Storehouse, due));

        Assert.Equal(BuildingKind.Storehouse, error.Kind);
        Assert.Contains("cannot complete twice", error.Message, StringComparison.Ordinal);

        // The first completion still stands.
        Assert.Equal(
            ConstructionStatus.Complete,
            house.Settlement.BuildingOf(BuildingKind.Storehouse).Status);
    }

    [Fact]
    public void A_construction_cannot_complete_before_it_is_due()
    {
        var (house, duration) = StartStorehouse();
        var oneSecondEarly = Noon + duration - TimeSpan.FromSeconds(1);

        Assert.Throws<InvalidConstructionStateException>(
            () => house.CompleteConstruction(BuildingKind.Storehouse, oneSecondEarly));

        Assert.Equal(
            ConstructionStatus.UnderConstruction,
            house.Settlement.BuildingOf(BuildingKind.Storehouse).Status);
    }

    [Fact]
    public void A_building_that_was_never_started_cannot_complete()
    {
        var house = WealthyHouse();

        Assert.Throws<InvalidConstructionStateException>(
            () => house.CompleteConstruction(BuildingKind.Mine, Noon));
    }

    [Fact]
    public void A_construction_cannot_start_twice()
    {
        var (house, _) = StartStorehouse();
        var definition = BuildingCatalogue.DefinitionOf(BuildingKind.Storehouse);

        Assert.Throws<InvalidConstructionStateException>(
            () => house.BeginConstruction(
                BuildingKind.Storehouse, definition.Cost, definition.Duration, Noon));
    }

    [Fact]
    public void Progress_is_read_from_the_supplied_time_not_a_clock()
    {
        var (house, duration) = StartStorehouse();
        var building = house.Settlement.BuildingOf(BuildingKind.Storehouse);

        Assert.False(building.IsDueAt(Noon));
        Assert.False(building.IsDueAt(Noon + duration - TimeSpan.FromTicks(1)));
        Assert.True(building.IsDueAt(Noon + duration));

        // Days of absence resolve on the next read, without anything having run
        // in between.
        Assert.True(building.IsDueAt(Noon + TimeSpan.FromDays(3)));
    }

    [Fact]
    public void Starting_a_construction_spends_its_cost()
    {
        var house = WealthyHouse();
        var definition = BuildingCatalogue.DefinitionOf(BuildingKind.HouseHall);
        var timberBefore = house.Resources.AmountOf(ResourceKind.Timber);

        house.BeginConstruction(BuildingKind.HouseHall, definition.Cost, definition.Duration, Noon);

        Assert.Equal(
            timberBefore - definition.Cost.Entries[ResourceKind.Timber],
            house.Resources.AmountOf(ResourceKind.Timber));
    }

    [Fact]
    public void A_construction_that_cannot_be_afforded_neither_starts_nor_spends()
    {
        var house = House.Establish(
            Guid.NewGuid(),
            "House Destitute",
            Kingdom.Arkazia,
            Settlement.FoundOutpost(Guid.NewGuid(), "Bare Reach"),
            ResourcePool.With((ResourceKind.Timber, 1)));

        var definition = BuildingCatalogue.DefinitionOf(BuildingKind.HouseHall);

        Assert.Throws<InsufficientResourcesException>(
            () => house.BeginConstruction(
                BuildingKind.HouseHall, definition.Cost, definition.Duration, Noon));

        Assert.Equal(1, house.Resources.AmountOf(ResourceKind.Timber));
        Assert.Equal(
            ConstructionStatus.NotBuilt,
            house.Settlement.BuildingOf(BuildingKind.HouseHall).Status);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-3600)]
    public void An_invalid_duration_leaves_resources_and_building_state_unchanged(int seconds)
    {
        // The duration is validated before anything is spent. Checking it only
        // inside Building would be too late: the cost would already be gone,
        // leaving the House poorer with nothing under construction.
        var house = WealthyHouse();
        var cost = BuildingCatalogue.DefinitionOf(BuildingKind.Mine).Cost;

        var before = Enum.GetValues<ResourceKind>()
            .ToDictionary(kind => kind, house.Resources.AmountOf);

        Assert.Throws<ArgumentOutOfRangeException>(
            () => house.BeginConstruction(
                BuildingKind.Mine, cost, TimeSpan.FromSeconds(seconds), Noon));

        Assert.All(before, entry =>
            Assert.Equal(entry.Value, house.Resources.AmountOf(entry.Key)));

        var mine = house.Settlement.BuildingOf(BuildingKind.Mine);
        Assert.Equal(ConstructionStatus.NotBuilt, mine.Status);
        Assert.Null(mine.StartedAtUtc);
        Assert.Null(mine.CompletesAtUtc);
    }

    [Fact]
    public void A_completed_construction_is_not_re_charged_when_a_second_start_is_rejected()
    {
        var (house, duration) = StartStorehouse();
        house.CompleteConstruction(BuildingKind.Storehouse, Noon + duration);

        var definition = BuildingCatalogue.DefinitionOf(BuildingKind.Storehouse);
        var timberAfterFirstBuild = house.Resources.AmountOf(ResourceKind.Timber);

        Assert.Throws<InvalidConstructionStateException>(
            () => house.BeginConstruction(
                BuildingKind.Storehouse, definition.Cost, definition.Duration, Noon + duration));

        Assert.Equal(timberAfterFirstBuild, house.Resources.AmountOf(ResourceKind.Timber));
    }
}
