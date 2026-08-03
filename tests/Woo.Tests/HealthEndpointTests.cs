using System.Net;
using System.Text.Json;

namespace Woo.Tests;

public sealed class HealthEndpointTests(WooApiFactory factory) : IClassFixture<WooApiFactory>
{
    [Fact]
    public async Task Health_reports_healthy_when_postgresql_is_reachable()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var json = JsonDocument.Parse(body);
        var root = json.RootElement;

        Assert.Equal("Healthy", root.GetProperty("status").GetString());

        var checks = root.GetProperty("checks").EnumerateArray().ToArray();
        var postgres = Assert.Single(checks, check => check.GetProperty("name").GetString() == "postgresql");
        Assert.Equal("Healthy", postgres.GetProperty("status").GetString());
    }
}
