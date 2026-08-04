namespace Woo.Api.Features.Resources;

/// <summary>
/// A settlement's holdings of the six universal resources.
/// </summary>
/// <remarks>
/// The rule this type exists to enforce: <b>a spend can never take a balance
/// below zero</b>, and a multi-resource cost is all-or-nothing. A cost that
/// cannot be paid in full changes nothing at all — no partial spend, no
/// clamping to zero.
/// </remarks>
public sealed class ResourcePool
{
    private readonly List<ResourceBalance> _balances = [];

    private ResourcePool()
    {
        // EF Core materialisation.
    }

    private ResourcePool(IEnumerable<ResourceBalance> balances) => _balances.AddRange(balances);

    public IReadOnlyList<ResourceBalance> Balances => _balances;

    /// <summary>
    /// A pool holding every resource, each at zero.
    /// </summary>
    public static ResourcePool Empty() =>
        new(Enum.GetValues<ResourceKind>().Select(kind => new ResourceBalance(kind, 0)));

    public static ResourcePool With(params (ResourceKind Kind, long Amount)[] amounts)
    {
        ArgumentNullException.ThrowIfNull(amounts);

        var pool = Empty();

        foreach (var (kind, amount) in amounts)
        {
            pool.Add(kind, amount);
        }

        return pool;
    }

    public long AmountOf(ResourceKind kind) => BalanceOf(kind).Amount;

    public void Add(ResourceKind kind, long amount) => BalanceOf(kind).Add(amount);

    /// <summary>
    /// Whether every resource in the cost is available. Ask this before
    /// <see cref="Spend"/> wherever a shortage is an ordinary outcome rather
    /// than a bug.
    /// </summary>
    public bool CanAfford(ResourceCost cost)
    {
        ArgumentNullException.ThrowIfNull(cost);

        return cost.Entries.All(entry => AmountOf(entry.Key) >= entry.Value);
    }

    /// <summary>
    /// Spends the whole cost, or throws and changes nothing.
    /// </summary>
    /// <exception cref="InsufficientResourcesException">
    /// Any resource in the cost is short. No balance is modified.
    /// </exception>
    public void Spend(ResourceCost cost)
    {
        ArgumentNullException.ThrowIfNull(cost);

        // Check every entry before deducting any, so a shortage in the last
        // resource cannot leave the first ones already spent.
        foreach (var (kind, required) in cost.Entries)
        {
            var available = AmountOf(kind);

            if (available < required)
            {
                throw new InsufficientResourcesException(kind, required, available);
            }
        }

        foreach (var (kind, required) in cost.Entries)
        {
            BalanceOf(kind).Deduct(required);
        }
    }

    private ResourceBalance BalanceOf(ResourceKind kind) =>
        _balances.SingleOrDefault(balance => balance.Kind == kind)
        ?? throw new InvalidOperationException(
            $"The pool has no balance for {kind}. A pool always holds every resource.");
}
