using Woo.Api.Features.Resources;

namespace Woo.Tests;

/// <summary>
/// The first-slice rule: <b>resources cannot be spent below zero.</b>
/// </summary>
public sealed class ResourceRuleTests
{
    [Fact]
    public void Spending_more_than_the_balance_is_rejected()
    {
        var pool = ResourcePool.With((ResourceKind.Timber, 50));

        var error = Assert.Throws<InsufficientResourcesException>(
            () => pool.Spend(ResourceCost.Of((ResourceKind.Timber, 51))));

        Assert.Equal(ResourceKind.Timber, error.Kind);
        Assert.Equal(51, error.Required);
        Assert.Equal(50, error.Available);
    }

    [Fact]
    public void A_rejected_spend_leaves_every_balance_untouched()
    {
        var pool = ResourcePool.With(
            (ResourceKind.Timber, 100),
            (ResourceKind.Stone, 100),
            (ResourceKind.Ore, 5));

        // Timber and Stone are affordable; Ore is not. Nothing may be spent.
        var cost = ResourceCost.Of(
            (ResourceKind.Timber, 10),
            (ResourceKind.Stone, 10),
            (ResourceKind.Ore, 10));

        Assert.False(pool.CanAfford(cost));
        Assert.Throws<InsufficientResourcesException>(() => pool.Spend(cost));

        Assert.Equal(100, pool.AmountOf(ResourceKind.Timber));
        Assert.Equal(100, pool.AmountOf(ResourceKind.Stone));
        Assert.Equal(5, pool.AmountOf(ResourceKind.Ore));
    }

    [Fact]
    public void Spending_the_exact_balance_is_allowed_and_lands_on_zero()
    {
        var pool = ResourcePool.With((ResourceKind.Gold, 250));

        pool.Spend(ResourceCost.Of((ResourceKind.Gold, 250)));

        Assert.Equal(0, pool.AmountOf(ResourceKind.Gold));
    }

    [Fact]
    public void An_affordable_multi_resource_cost_is_spent_in_full()
    {
        var pool = ResourcePool.With(
            (ResourceKind.Timber, 100),
            (ResourceKind.Stone, 100));

        pool.Spend(ResourceCost.Of(
            (ResourceKind.Timber, 40),
            (ResourceKind.Stone, 25)));

        Assert.Equal(60, pool.AmountOf(ResourceKind.Timber));
        Assert.Equal(75, pool.AmountOf(ResourceKind.Stone));
    }

    [Fact]
    public void A_new_pool_holds_every_resource_at_zero()
    {
        var pool = ResourcePool.Empty();

        Assert.All(Enum.GetValues<ResourceKind>(), kind => Assert.Equal(0, pool.AmountOf(kind)));
    }
}
