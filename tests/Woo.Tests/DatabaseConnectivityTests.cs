using Microsoft.EntityFrameworkCore;
using Woo.Api.Persistence;

namespace Woo.Tests;

/// <summary>
/// Connectivity against a real PostgreSQL instance — the Compose container
/// locally, the workflow service container in CI. There is nothing to migrate
/// yet: the first migration arrives with the first entities in Prompt 3.
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

    [Fact]
    public async Task The_context_declares_no_entities_yet()
    {
        var options = new DbContextOptionsBuilder<WooDbContext>()
            .UseNpgsql(WooApiFactory.ConnectionString)
            .Options;

        await using var db = new WooDbContext(options);

        // Guards the Prompt 2 boundary: no gameplay model has been smuggled in.
        Assert.Empty(db.Model.GetEntityTypes());
    }
}
