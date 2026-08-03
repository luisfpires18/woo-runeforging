using System.Net;
using System.Text.Json;

namespace Woo.Tests;

/// <summary>
/// The endpoint the web client calls. If these fail, the frontend cannot render
/// anything real.
/// </summary>
public sealed class PlatformEndpointTests(WooApiFactory factory) : IClassFixture<WooApiFactory>
{
    [Fact]
    public async Task Status_returns_the_expected_shape()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/platform/status", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var json = JsonDocument.Parse(body);
        var root = json.RootElement;

        Assert.Equal("Weapons of Chaos and Order", root.GetProperty("application").GetString());
        Assert.False(string.IsNullOrWhiteSpace(root.GetProperty("environment").GetString()));
        Assert.True(root.GetProperty("utcNow").TryGetDateTimeOffset(out _));
        Assert.True(root.GetProperty("database").GetProperty("connected").GetBoolean());
    }

    [Fact]
    public async Task Status_does_not_leak_the_database_server_version()
    {
        using var client = factory.CreateClient();

        var body = await client.GetStringAsync("/api/v1/platform/status", TestContext.Current.CancellationToken);
        using var json = JsonDocument.Parse(body);

        var database = json.RootElement.GetProperty("database");

        var only = Assert.Single(database.EnumerateObject());
        Assert.Equal("connected", only.Name);
    }

    [Fact]
    public async Task Unknown_route_returns_not_found()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/does-not-exist", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
