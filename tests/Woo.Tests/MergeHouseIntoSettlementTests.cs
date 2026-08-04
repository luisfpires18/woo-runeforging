using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using NpgsqlTypes;
using Woo.Api.Persistence;

namespace Woo.Tests;

/// <summary>
/// The <c>MergeHouseIntoSettlement</c> migration, against a database that
/// already holds House-era rows.
/// </summary>
/// <remarks>
/// <para>
/// This test cannot use <see cref="PostgresFixture"/>: that fixture migrates to
/// the <b>latest</b> schema on initialisation, so nothing sharing it can ever
/// observe a populated <c>InitialHouseAggregate</c> database. It therefore
/// creates and drops a database of its own.
/// </para>
/// <para>
/// A separate database rather than a schema, because <c>__EFMigrationsHistory</c>
/// is per-database and migration history is exactly what is under test.
/// </para>
/// <para>
/// Legacy rows are inserted with raw SQL. The current EF model has no
/// <c>House</c> type and could not write them if it wanted to — which is the
/// point: this is the shape a deployed database is in when the migration
/// arrives, not a shape the code can still produce.
/// </para>
/// </remarks>
public sealed class MergeHouseIntoSettlementTests : IAsyncLifetime
{
    private const string InitialMigration = "20260803111510_InitialHouseAggregate";
    private const string MergeMigration = "20260804095831_MergeHouseIntoSettlement";

    private static readonly DateTimeOffset Noon =
        new(2026, 8, 3, 12, 0, 0, TimeSpan.Zero);

    private readonly string _databaseName = $"woo_migration_{Guid.NewGuid():N}";

    private readonly Guid _houseId = Guid.NewGuid();
    private readonly Guid _settlementId = Guid.NewGuid();

    private string ConnectionString =>
        new NpgsqlConnectionStringBuilder(WooApiFactory.ConnectionString)
        {
            Database = _databaseName,
        }.ConnectionString;

    private static string MaintenanceConnectionString =>
        new NpgsqlConnectionStringBuilder(WooApiFactory.ConnectionString)
        {
            Database = "postgres",
        }.ConnectionString;

    public async ValueTask InitializeAsync() =>
        await ExecuteOnMaintenanceAsync($"""CREATE DATABASE "{_databaseName}";""");

    public async ValueTask DisposeAsync()
    {
        // Npgsql pools connections per connection string, and a pooled
        // connection still counts as a session holding the database open.
        NpgsqlConnection.ClearAllPools();

        await ExecuteOnMaintenanceAsync($"""DROP DATABASE IF EXISTS "{_databaseName}" WITH (FORCE);""");
    }

    [Fact]
    public async Task A_populated_house_database_migrates_up_and_back_down()
    {
        var token = TestContext.Current.CancellationToken;

        await MigrateToAsync(InitialMigration, token);
        await SeedLegacyRowsAsync(token);

        // ---- Up ----
        await MigrateToAsync(MergeMigration, token);

        Assert.False(await TableExistsAsync("Houses", token));

        var settlement = await SingleRowAsync(
            """SELECT "Name", "Stage", "Kingdom" FROM "Settlements" WHERE "Id" = @id""",
            token,
            ("id", _settlementId));

        Assert.Equal("Arkazian Outpost", settlement["Name"]);
        Assert.Equal("Outpost", settlement["Stage"]);
        Assert.Equal("Arkazia", settlement["Kingdom"]);
        Assert.False(await ColumnExistsAsync("Settlements", "HouseId", token));

        // The renamed enum member moved with its rows, and the state it was
        // carrying came too.
        var commandHall = await SingleRowAsync(
            """
            SELECT "Status", "StartedAtUtc", "CompletesAtUtc", "CompletedAtUtc"
            FROM "Buildings" WHERE "SettlementId" = @id AND "Kind" = 'CommandHall'
            """,
            token,
            ("id", _settlementId));

        Assert.Equal("Complete", commandHall["Status"]);
        AssertInstant(Noon, commandHall["StartedAtUtc"]);
        AssertInstant(Noon.AddMinutes(30), commandHall["CompletesAtUtc"]);
        AssertInstant(Noon.AddMinutes(30), commandHall["CompletedAtUtc"]);

        Assert.Equal(0, await ScalarAsync<long>(
            """SELECT COUNT(*) FROM "Buildings" WHERE "Kind" = 'HouseHall'""", token));

        var underConstruction = await SingleRowAsync(
            """
            SELECT "Status", "StartedAtUtc", "CompletesAtUtc"
            FROM "Buildings" WHERE "SettlementId" = @id AND "Kind" = 'Quarry'
            """,
            token,
            ("id", _settlementId));

        Assert.Equal("UnderConstruction", underConstruction["Status"]);
        AssertInstant(Noon, underConstruction["StartedAtUtc"]);
        AssertInstant(Noon.AddMinutes(20), underConstruction["CompletesAtUtc"]);

        Assert.Equal(5, await ScalarAsync<long>(
            $"""SELECT COUNT(*) FROM "Buildings" WHERE "SettlementId" = '{_settlementId}'""", token));

        // Balances re-pointed at the settlement rather than keeping a house id
        // that no longer identifies anything.
        Assert.False(await ColumnExistsAsync("ResourceBalances", "HouseId", token));

        Assert.Equal(6, await ScalarAsync<long>(
            $"""SELECT COUNT(*) FROM "ResourceBalances" WHERE "SettlementId" = '{_settlementId}'""",
            token));

        Assert.Equal(220L, await ScalarAsync<long>(
            $"""
            SELECT "Amount" FROM "ResourceBalances"
            WHERE "SettlementId" = '{_settlementId}' AND "Kind" = 'Timber'
            """,
            token));

        Assert.Equal(
            ["Kind", "SettlementId"],
            await PrimaryKeyColumnsAsync("ResourceBalances", token));

        Assert.True(await ForeignKeyExistsAsync(
            "FK_ResourceBalances_Settlements_SettlementId", token));

        // ---- Down ----
        await MigrateToAsync(InitialMigration, token);

        Assert.True(await TableExistsAsync("Houses", token));
        Assert.True(await ColumnExistsAsync("Settlements", "HouseId", token));
        Assert.True(await ColumnExistsAsync("ResourceBalances", "HouseId", token));
        Assert.False(await ColumnExistsAsync("ResourceBalances", "SettlementId", token));
        Assert.False(await ColumnExistsAsync("Settlements", "Kingdom", token));

        Assert.Equal(
            ["HouseId", "Kind"],
            await PrimaryKeyColumnsAsync("ResourceBalances", token));

        Assert.True(await ForeignKeyExistsAsync("FK_ResourceBalances_Houses_HouseId", token));
        Assert.True(await ForeignKeyExistsAsync("FK_Settlements_Houses_HouseId", token));

        var restoredHouse = await SingleRowAsync(
            """SELECT h."Name", h."Kingdom" FROM "Houses" AS h""", token);

        Assert.Equal("House Karrow", restoredHouse["Name"]);
        Assert.Equal("Arkazia", restoredHouse["Kingdom"]);

        // Both relationships point back at the same row again.
        Assert.Equal(1, await ScalarAsync<long>(
            """
            SELECT COUNT(*) FROM "Settlements" AS s
            JOIN "Houses" AS h ON h."Id" = s."HouseId"
            """,
            token));

        Assert.Equal(6, await ScalarAsync<long>(
            """
            SELECT COUNT(*) FROM "ResourceBalances" AS rb
            JOIN "Houses" AS h ON h."Id" = rb."HouseId"
            """,
            token));

        // The building kind came back with it, and nothing else was disturbed.
        Assert.Equal(1, await ScalarAsync<long>(
            """SELECT COUNT(*) FROM "Buildings" WHERE "Kind" = 'HouseHall'""", token));

        Assert.Equal(0, await ScalarAsync<long>(
            """SELECT COUNT(*) FROM "Buildings" WHERE "Kind" = 'CommandHall'""", token));

        Assert.Equal(5, await ScalarAsync<long>(
            $"""SELECT COUNT(*) FROM "Buildings" WHERE "SettlementId" = '{_settlementId}'""", token));

        var restoredSettlement = await SingleRowAsync(
            """SELECT "Stage" FROM "Settlements" """, token);

        Assert.Equal("Outpost", restoredSettlement["Stage"]);

        Assert.Equal(220L, await ScalarAsync<long>(
            """SELECT "Amount" FROM "ResourceBalances" WHERE "Kind" = 'Timber'""", token));
    }

    /// <summary>
    /// Npgsql reads a <c>timestamptz</c> back as a UTC <see cref="DateTime"/>
    /// through the raw reader, so the comparison is made on the instant rather
    /// than on the CLR type the domain happens to use.
    /// </summary>
    private static void AssertInstant(DateTimeOffset expected, object? actual)
    {
        var stored = Assert.IsType<DateTime>(actual);

        Assert.Equal(DateTimeKind.Utc, stored.Kind);
        Assert.Equal(expected, new DateTimeOffset(stored));
    }

    /// <summary>
    /// Rows exactly as <c>InitialHouseAggregate</c> would have stored them:
    /// a House, its Settlement, five buildings including a completed
    /// <c>HouseHall</c> and an in-flight Quarry, and all six balances.
    /// </summary>
    private async Task SeedLegacyRowsAsync(CancellationToken token)
    {
        await ExecuteAsync(
            $"""
            INSERT INTO "Houses" ("Id", "Name", "Kingdom")
            VALUES ('{_houseId}', 'House Karrow', 'Arkazia');

            INSERT INTO "Settlements" ("Id", "Name", "Stage", "HouseId")
            VALUES ('{_settlementId}', 'Ashen Reach', 'Outpost', '{_houseId}');

            INSERT INTO "Buildings"
                ("SettlementId", "Kind", "Status", "StartedAtUtc", "CompletesAtUtc", "CompletedAtUtc")
            VALUES
                ('{_settlementId}', 'HouseHall',  'Complete',          '{Noon:O}', '{Noon.AddMinutes(30):O}', '{Noon.AddMinutes(30):O}'),
                ('{_settlementId}', 'Quarry',     'UnderConstruction', '{Noon:O}', '{Noon.AddMinutes(20):O}', NULL),
                ('{_settlementId}', 'Storehouse', 'NotBuilt',          NULL, NULL, NULL),
                ('{_settlementId}', 'LumberYard', 'NotBuilt',          NULL, NULL, NULL),
                ('{_settlementId}', 'Mine',       'NotBuilt',          NULL, NULL, NULL);

            INSERT INTO "ResourceBalances" ("HouseId", "Kind", "Amount")
            VALUES
                ('{_houseId}', 'Gold', 250),
                ('{_houseId}', 'Provisions', 200),
                ('{_houseId}', 'Timber', 220),
                ('{_houseId}', 'Stone', 180),
                ('{_houseId}', 'Ore', 120),
                ('{_houseId}', 'WorkshopSupplies', 100);
            """,
            token);
    }

    private async Task MigrateToAsync(string target, CancellationToken token)
    {
        await using var db = CreateContext();

        var migrator = db.GetInfrastructure().GetRequiredService<IMigrator>();
        await migrator.MigrateAsync(target, cancellationToken: token);
    }

    private WooDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<WooDbContext>()
            .UseNpgsql(ConnectionString)
            .Options);

    // ---- raw SQL helpers ----

    private static async Task ExecuteOnMaintenanceAsync(string sql)
    {
        await using var connection = new NpgsqlConnection(MaintenanceConnectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);

        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync(TestContext.Current.CancellationToken);
    }

    private async Task ExecuteAsync(string sql, CancellationToken token)
    {
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync(token);

        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync(token);
    }

    private async Task<T> ScalarAsync<T>(string sql, CancellationToken token)
    {
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync(token);

        await using var command = new NpgsqlCommand(sql, connection);
        var value = await command.ExecuteScalarAsync(token);

        return (T)Convert.ChangeType(value!, typeof(T), System.Globalization.CultureInfo.InvariantCulture);
    }

    private async Task<Dictionary<string, object?>> SingleRowAsync(
        string sql,
        CancellationToken token,
        params (string Name, object Value)[] parameters)
    {
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync(token);

        await using var command = new NpgsqlCommand(sql, connection);

        foreach (var (name, value) in parameters)
        {
            command.Parameters.AddWithValue(name, NpgsqlDbType.Uuid, value);
        }

        await using var reader = await command.ExecuteReaderAsync(token);

        Assert.True(await reader.ReadAsync(token), $"No row returned by: {sql}");

        var row = new Dictionary<string, object?>(StringComparer.Ordinal);

        for (var i = 0; i < reader.FieldCount; i++)
        {
            row[reader.GetName(i)] = await reader.IsDBNullAsync(i, token)
                ? null
                : reader.GetValue(i);
        }

        Assert.False(await reader.ReadAsync(token), $"More than one row returned by: {sql}");

        return row;
    }

    private Task<bool> TableExistsAsync(string table, CancellationToken token) =>
        ScalarAsync<bool>(
            $"""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = '{table}')
            """,
            token);

    private Task<bool> ColumnExistsAsync(string table, string column, CancellationToken token) =>
        ScalarAsync<bool>(
            $"""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = '{table}' AND column_name = '{column}')
            """,
            token);

    private Task<bool> ForeignKeyExistsAsync(string constraint, CancellationToken token) =>
        ScalarAsync<bool>(
            $"""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_type = 'FOREIGN KEY' AND constraint_name = '{constraint}')
            """,
            token);

    private async Task<string[]> PrimaryKeyColumnsAsync(string table, CancellationToken token)
    {
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync(token);

        await using var command = new NpgsqlCommand(
            $"""
            SELECT kcu.column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON kcu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = '{table}'
            ORDER BY kcu.column_name
            """,
            connection);

        await using var reader = await command.ExecuteReaderAsync(token);

        var columns = new List<string>();

        while (await reader.ReadAsync(token))
        {
            columns.Add(reader.GetString(0));
        }

        return [.. columns];
    }
}
