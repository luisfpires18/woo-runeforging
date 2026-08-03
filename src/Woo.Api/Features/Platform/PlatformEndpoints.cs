using Microsoft.EntityFrameworkCore;
using Woo.Api.Persistence;

namespace Woo.Api.Features.Platform;

/// <summary>
/// The one API endpoint the web client calls. It carries no gameplay meaning;
/// it exists so that the browser -> ASP.NET Core -> PostgreSQL path is proven
/// end to end before any feature is built on top of it.
/// </summary>
internal static class PlatformEndpoints
{
    public static IEndpointRouteBuilder MapPlatformEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/v1/platform/status", GetStatusAsync);

        return endpoints;
    }

    private static async Task<PlatformStatus> GetStatusAsync(
        WooDbContext db,
        IHostEnvironment environment,
        TimeProvider timeProvider,
        CancellationToken cancellationToken)
    {
        var connected = await db.Database.CanConnectAsync(cancellationToken);

        return new PlatformStatus(
            Application: "Weapons of Chaos and Order",
            Environment: environment.EnvironmentName,
            UtcNow: timeProvider.GetUtcNow(),
            Database: new DatabaseStatus(connected));
    }
}

internal sealed record PlatformStatus(
    string Application,
    string Environment,
    DateTimeOffset UtcNow,
    DatabaseStatus Database);

/// <summary>
/// Whether the application can reach PostgreSQL. The server version is
/// deliberately not exposed: it is infrastructure detail with no value to a
/// client and no reason to leave the process.
/// </summary>
internal sealed record DatabaseStatus(bool Connected);
