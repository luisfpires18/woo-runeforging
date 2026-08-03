using Microsoft.EntityFrameworkCore;
using Woo.Api.Features.Health;
using Woo.Api.Features.Platform;
using Woo.Api.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Structured console logging. Every entry is one JSON object on stdout, which
// is what a container platform expects and what a human can still grep.
builder.Logging.ClearProviders();
builder.Logging.AddJsonConsole(options =>
{
    options.IncludeScopes = true;
    options.TimestampFormat = "yyyy-MM-dd'T'HH:mm:ss.fff'Z'";
    options.UseUtcTimestamp = true;
});

// Fail fast on missing configuration rather than throwing on the first request.
var connectionString = builder.Configuration.GetConnectionString("Woo");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Connection string 'Woo' is not configured. Set ConnectionStrings:Woo in " +
        "appsettings.Development.json, or the ConnectionStrings__Woo environment variable. " +
        "See README.md for the local development defaults.");
}

builder.Services.AddSingleton(TimeProvider.System);

builder.Services.AddDbContext<WooDbContext>(options => options.UseNpgsql(connectionString));

builder.Services
    .AddHealthChecks()
    .AddDbContextCheck<WooDbContext>("postgresql");

var app = builder.Build();

app.MapHealthEndpoints();
app.MapPlatformEndpoints();

app.Run();

/// <summary>
/// Exposed so the test project can host the application in memory through
/// <c>WebApplicationFactory</c>.
/// </summary>
public partial class Program;
