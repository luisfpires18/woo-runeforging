using Microsoft.EntityFrameworkCore;
using Woo.Api.Content;
using Woo.Api.Features.Resources;
using Woo.Api.Features.Settlements;

namespace Woo.Tests;

/// <summary>
/// The Settlement aggregate against a real PostgreSQL instance.
/// </summary>
/// <remarks>
/// Each test generates its own identifiers and deletes what it wrote in a
/// <c>finally</c>, so it never depends on — or disturbs — anything already in
/// the database. That is what lets the same suite run against a developer's
/// container and CI's service container, twice in a row, with the same result.
/// </remarks>
[Collection(nameof(PostgresCollection))]
public sealed class SettlementPersistenceTests(PostgresFixture postgres)
{
    private static readonly DateTimeOffset Noon =
        new(2026, 8, 3, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task A_settlement_round_trips_with_its_buildings_and_balances()
    {
        var settlementId = Guid.NewGuid();
        var token = TestContext.Current.CancellationToken;

        try
        {
            var definition = BuildingCatalogue.DefinitionOf(BuildingKind.Storehouse);

            await using (var write = postgres.CreateContext())
            {
                var settlement = StarterContent.FoundStarterSettlement(settlementId);
                settlement.BeginConstruction(
                    BuildingKind.Storehouse, definition.Cost, definition.Duration, Noon);
                settlement.CompleteConstruction(
                    BuildingKind.Storehouse, Noon + definition.Duration);

                write.Settlements.Add(settlement);
                await write.SaveChangesAsync(token);
            }

            await using var read = postgres.CreateContext();

            var stored = await read.Settlements
                .Include(settlement => settlement.Buildings)
                .Include(settlement => settlement.Resources)
                .ThenInclude(resources => resources.Balances)
                .SingleAsync(settlement => settlement.Id == settlementId, token);

            Assert.Equal(StarterContent.SettlementName, stored.Name);
            Assert.Equal(Kingdom.Arkazia, stored.Kingdom);
            Assert.Equal(SettlementStage.Outpost, stored.Stage);

            var storehouse = stored.BuildingOf(BuildingKind.Storehouse);
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
            await DeleteSettlementAsync(settlementId);
        }
    }

    [Fact]
    public async Task Enums_are_stored_as_readable_strings_not_ordinals()
    {
        var settlementId = Guid.NewGuid();
        var token = TestContext.Current.CancellationToken;

        try
        {
            await using (var write = postgres.CreateContext())
            {
                write.Settlements.Add(StarterContent.FoundStarterSettlement(settlementId));
                await write.SaveChangesAsync(token);
            }

            await using var read = postgres.CreateContext();

            // Read the raw column rather than the mapped property, so the
            // conversion itself is what is under test.
            var kingdom = await read.Database
                .SqlQuery<string>($"""SELECT "Kingdom" AS "Value" FROM "Settlements" WHERE "Id" = {settlementId}""")
                .SingleAsync(token);

            Assert.Equal(nameof(Kingdom.Arkazia), kingdom);

            var stages = await read.Database
                .SqlQuery<string>($"""SELECT "Stage" AS "Value" FROM "Settlements" WHERE "Id" = {settlementId}""")
                .ToListAsync(token);

            Assert.Equal([nameof(SettlementStage.Outpost)], stages);

            // The building kind is stored by name too, which is why renaming a
            // member needs a migration for the rows as well as the code.
            var buildingKinds = await read.Database
                .SqlQuery<string>($"""SELECT "Kind" AS "Value" FROM "Buildings" WHERE "SettlementId" = {settlementId}""")
                .ToListAsync(token);

            Assert.Contains(nameof(BuildingKind.CommandHall), buildingKinds);

            var balanceKinds = await read.Database
                .SqlQuery<string>($"""SELECT "Kind" AS "Value" FROM "ResourceBalances" WHERE "SettlementId" = {settlementId}""")
                .ToListAsync(token);

            Assert.Equivalent(
                Enum.GetValues<ResourceKind>().Select(kind => kind.ToString()).ToArray(),
                balanceKinds);
        }
        finally
        {
            await DeleteSettlementAsync(settlementId);
        }
    }

    [Fact]
    public async Task A_completed_construction_stays_completed_across_a_reload()
    {
        var settlementId = Guid.NewGuid();
        var token = TestContext.Current.CancellationToken;

        try
        {
            var definition = BuildingCatalogue.DefinitionOf(BuildingKind.Quarry);
            var due = Noon + definition.Duration;

            await using (var write = postgres.CreateContext())
            {
                var settlement = StarterContent.FoundStarterSettlement(settlementId);
                settlement.BeginConstruction(
                    BuildingKind.Quarry, definition.Cost, definition.Duration, Noon);
                settlement.CompleteConstruction(BuildingKind.Quarry, due);

                write.Settlements.Add(settlement);
                await write.SaveChangesAsync(token);
            }

            await using var read = postgres.CreateContext();

            var stored = await read.Settlements
                .Include(settlement => settlement.Buildings)
                .SingleAsync(settlement => settlement.Id == settlementId, token);

            // The rule survives the round trip: it is a property of the stored
            // state, not of an object that happens to be in memory.
            Assert.Throws<InvalidConstructionStateException>(
                () => stored.CompleteConstruction(BuildingKind.Quarry, due));
        }
        finally
        {
            await DeleteSettlementAsync(settlementId);
        }
    }

    /// <summary>
    /// Removes only the rows this test wrote. Cascades take the buildings and
    /// balances with the settlement.
    /// </summary>
    private async Task DeleteSettlementAsync(Guid settlementId)
    {
        await using var cleanup = postgres.CreateContext();

        await cleanup.Settlements
            .Where(settlement => settlement.Id == settlementId)
            .ExecuteDeleteAsync(TestContext.Current.CancellationToken);
    }
}
