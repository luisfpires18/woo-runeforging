using Microsoft.EntityFrameworkCore;
using Woo.Api.Features.Resources;
using Woo.Api.Features.Settlements;
using Woo.Api.Persistence;

namespace Woo.Tests;

/// <summary>
/// Connectivity against a real PostgreSQL instance — the Compose container
/// locally, the workflow service container in CI.
/// </summary>
public sealed class DatabaseConnectivityTests
{
    [Fact]
    public async Task The_context_can_connect_to_postgresql()
    {
        var options = new DbContextOptionsBuilder<WooDbContext>()
            .UseNpgsql(WooApiFactory.ConnectionString)
            .Options;

        await using var db = new WooDbContext(options);

        // OpenConnectionAsync rather than CanConnectAsync: the former reports
        // why the connection failed, the latter only that it did.
        await db.Database.OpenConnectionAsync(TestContext.Current.CancellationToken);
        await db.Database.CloseConnectionAsync();
    }

    /// <summary>
    /// Replaces Prompt 2's "the model declares no entities" guard. That test
    /// existed to catch gameplay leaking into the platform, and this prompt is
    /// the change it was watching for — so the guard moves rather than
    /// disappears. It now pins the exact mapped set, and fails if anything
    /// unplanned is added.
    /// </summary>
    [Fact]
    public void The_model_maps_the_settlement_aggregate_and_nothing_else()
    {
        var options = new DbContextOptionsBuilder<WooDbContext>()
            .UseNpgsql(WooApiFactory.ConnectionString)
            .Options;

        using var db = new WooDbContext(options);

        // Compared by name: xUnit's structural comparison would try to reflect
        // over the members of Type itself.
        var mapped = db.Model.GetEntityTypes()
            .Select(entity => entity.ClrType.Name)
            .Order(StringComparer.Ordinal)
            .ToArray();

        string[] expected =
        [
            nameof(Building),
            nameof(ResourceBalance),
            nameof(ResourcePool),
            nameof(Settlement),
        ];

        Assert.Equal(expected, mapped);
    }
}
