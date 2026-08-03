using Microsoft.EntityFrameworkCore;
using Woo.Api.Content;
using Woo.Api.Features.Houses;
using Woo.Api.Features.Resources;
using Woo.Api.Features.Settlements;

namespace Woo.Tests;

/// <summary>
/// The House aggregate against a real PostgreSQL instance.
/// </summary>
/// <remarks>
/// Each test generates its own identifiers and deletes what it wrote in a
/// <c>finally</c>, so it never depends on — or disturbs — anything already in
/// the database. That is what lets the same suite run against a developer's
/// container and CI's service container, twice in a row, with the same result.
/// </remarks>
[Collection(nameof(PostgresCollection))]
public sealed class HousePersistenceTests(PostgresFixture postgres)
{
    private static readonly DateTimeOffset Noon =
        new(2026, 8, 3, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task A_house_round_trips_with_its_settlement_buildings_and_balances()
    {
        var houseId = Guid.NewGuid();
        var settlementId = Guid.NewGuid();
        var token = TestContext.Current.CancellationToken;

        try
        {
            var definition = BuildingCatalogue.DefinitionOf(BuildingKind.Storehouse);

            await using (var write = postgres.CreateContext())
            {
                var house = StarterContent.EstablishStarterHouse(houseId, settlementId);
                house.BeginConstruction(
                    BuildingKind.Storehouse, definition.Cost, definition.Duration, Noon);
                house.CompleteConstruction(BuildingKind.Storehouse, Noon + definition.Duration);

                write.Houses.Add(house);
                await write.SaveChangesAsync(token);
            }

            await using var read = postgres.CreateContext();

            var stored = await read.Houses
                .Include(house => house.Settlement)
                .ThenInclude(settlement => settlement.Buildings)
                .Include(house => house.Resources)
                .ThenInclude(resources => resources.Balances)
                .SingleAsync(house => house.Id == houseId, token);

            Assert.Equal(StarterContent.HouseName, stored.Name);
            Assert.Equal(Kingdom.Arkazia, stored.Kingdom);

            Assert.Equal(settlementId, stored.Settlement.Id);
            Assert.Equal(StarterContent.OutpostName, stored.Settlement.Name);
            Assert.Equal(SettlementStage.Outpost, stored.Settlement.Stage);

            var storehouse = stored.Settlement.BuildingOf(BuildingKind.Storehouse);
            Assert.Equal(ConstructionStatus.Complete, storehouse.Status);
            Assert.Equal(Noon, storehouse.StartedAtUtc);
            Assert.Equal(Noon + definition.Duration, storehouse.CompletedAtUtc);

            // Timestamps survive as UTC, not as local time.
            Assert.Equal(TimeSpan.Zero, storehouse.StartedAtUtc!.Value.Offset);

            var expectedTimber =
                StarterContent.OpeningResources().AmountOf(ResourceKind.Timber)
                - definition.Cost.Entries[ResourceKind.Timber];

            Assert.Equal(expectedTimber, stored.Resources.AmountOf(ResourceKind.Timber));
            Assert.Equal(
                Enum.GetValues<ResourceKind>().Length,
                stored.Resources.Balances.Count);
        }
        finally
        {
            await DeleteHouseAsync(houseId);
        }
    }

    [Fact]
    public async Task Enums_are_stored_as_readable_strings_not_ordinals()
    {
        var houseId = Guid.NewGuid();
        var token = TestContext.Current.CancellationToken;

        try
        {
            await using (var write = postgres.CreateContext())
            {
                write.Houses.Add(StarterContent.EstablishStarterHouse(houseId, Guid.NewGuid()));
                await write.SaveChangesAsync(token);
            }

            await using var read = postgres.CreateContext();

            // Read the raw column rather than the mapped property, so the
            // conversion itself is what is under test.
            var kingdom = await read.Database
                .SqlQuery<string>($"""SELECT "Kingdom" AS "Value" FROM "Houses" WHERE "Id" = {houseId}""")
                .SingleAsync(token);

            Assert.Equal(nameof(Kingdom.Arkazia), kingdom);

            var stages = await read.Database
                .SqlQuery<string>($"""SELECT "Stage" AS "Value" FROM "Settlements" WHERE "HouseId" = {houseId}""")
                .ToListAsync(token);

            Assert.Equal([nameof(SettlementStage.Outpost)], stages);

            var balanceKinds = await read.Database
                .SqlQuery<string>($"""SELECT "Kind" AS "Value" FROM "ResourceBalances" WHERE "HouseId" = {houseId}""")
                .ToListAsync(token);

            Assert.Equivalent(
                Enum.GetValues<ResourceKind>().Select(kind => kind.ToString()).ToArray(),
                balanceKinds);
        }
        finally
        {
            await DeleteHouseAsync(houseId);
        }
    }

    [Fact]
    public async Task A_completed_construction_stays_completed_across_a_reload()
    {
        var houseId = Guid.NewGuid();
        var token = TestContext.Current.CancellationToken;

        try
        {
            var definition = BuildingCatalogue.DefinitionOf(BuildingKind.Quarry);
            var due = Noon + definition.Duration;

            await using (var write = postgres.CreateContext())
            {
                var house = StarterContent.EstablishStarterHouse(houseId, Guid.NewGuid());
                house.BeginConstruction(BuildingKind.Quarry, definition.Cost, definition.Duration, Noon);
                house.CompleteConstruction(BuildingKind.Quarry, due);

                write.Houses.Add(house);
                await write.SaveChangesAsync(token);
            }

            await using var read = postgres.CreateContext();

            var stored = await read.Houses
                .Include(house => house.Settlement)
                .ThenInclude(settlement => settlement.Buildings)
                .SingleAsync(house => house.Id == houseId, token);

            // The rule survives the round trip: it is a property of the stored
            // state, not of an object that happens to be in memory.
            Assert.Throws<InvalidConstructionStateException>(
                () => stored.CompleteConstruction(BuildingKind.Quarry, due));
        }
        finally
        {
            await DeleteHouseAsync(houseId);
        }
    }

    /// <summary>
    /// Removes only the rows this test wrote. Cascades take the settlement,
    /// buildings and balances with the House.
    /// </summary>
    private async Task DeleteHouseAsync(Guid houseId)
    {
        await using var cleanup = postgres.CreateContext();

        await cleanup.Houses
            .Where(house => house.Id == houseId)
            .ExecuteDeleteAsync(TestContext.Current.CancellationToken);
    }
}
