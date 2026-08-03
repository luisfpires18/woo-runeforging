using Microsoft.EntityFrameworkCore;
using Woo.Api.Persistence;

namespace Woo.Tests;

/// <summary>
/// A real PostgreSQL database, with the schema applied.
/// </summary>
/// <remarks>
/// <para>
/// The fixture applies the migrations itself, so the suite passes against a
/// database that has never been touched — <c>docker compose down -v</c>,
/// <c>up -d</c>, <c>dotnet test</c> works with no step in between, and CI's
/// service container needs no preparation.
/// </para>
/// <para>
/// It creates no data. Tests own the rows they write and remove them again, so
/// the database is left exactly as it was found and two runs in a row behave
/// identically.
/// </para>
/// </remarks>
public sealed class PostgresFixture : IAsyncLifetime
{
    public string ConnectionString => WooApiFactory.ConnectionString;

    public async ValueTask InitializeAsync()
    {
        await using var db = CreateContext();
        await db.Database.MigrateAsync(TestContext.Current.CancellationToken);
    }

    public ValueTask DisposeAsync() => ValueTask.CompletedTask;

    /// <summary>
    /// A fresh context. Tests use a new one per read so that an assertion is
    /// answered by the database rather than by the change tracker.
    /// </summary>
    public WooDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<WooDbContext>()
            .UseNpgsql(ConnectionString)
            .Options);
}

[CollectionDefinition(nameof(PostgresCollection))]
public sealed class PostgresCollection : ICollectionFixture<PostgresFixture>;
