using System.Text.Json;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Woo.Api.Features.Health;

/// <summary>
/// One health endpoint. It answers a single question: can this process serve
/// requests and reach its database?
/// </summary>
internal static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapHealthChecks("/health", new()
        {
            ResponseWriter = WriteResponseAsync,
        });

        return endpoints;
    }

    private static async Task WriteResponseAsync(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json; charset=utf-8";

        var payload = new
        {
            status = report.Status.ToString(),
            totalDurationMs = Math.Round(report.TotalDuration.TotalMilliseconds, 1),
            checks = report.Entries
                .Select(entry => new
                {
                    name = entry.Key,
                    status = entry.Value.Status.ToString(),
                    description = entry.Value.Description,
                })
                .OrderBy(check => check.name, StringComparer.Ordinal)
                .ToArray(),
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload, JsonOptions));
    }

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
}
