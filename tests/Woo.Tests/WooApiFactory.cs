using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Woo.Tests;

/// <summary>
/// Hosts the real application in memory. The connection string comes from the
/// same place the application reads it, so these tests exercise the configured
/// PostgreSQL instance rather than a substitute.
/// </summary>
public sealed class WooApiFactory : WebApplicationFactory<Program>
{
    /// <summary>
    /// Matches docker/docker-compose.yml. CI overrides it with
    /// ConnectionStrings__Woo pointing at the workflow's service container.
    /// </summary>
    public const string DefaultConnectionString =
        "Host=localhost;Port=5433;Database=woo;Username=woo;Password=woo";

    public static string ConnectionString =>
        Environment.GetEnvironmentVariable("ConnectionStrings__Woo") is { Length: > 0 } configured
            ? configured
            : DefaultConnectionString;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("ConnectionStrings:Woo", ConnectionString);
    }
}
