namespace Woo.Api.Features.Resources;

/// <summary>
/// What some action costs, across one or more resources. Immutable, and always
/// spent as a whole: a cost is never partially paid.
/// </summary>
public sealed class ResourceCost
{
    private readonly Dictionary<ResourceKind, long> _entries;

    private ResourceCost(Dictionary<ResourceKind, long> entries) => _entries = entries;

    public static ResourceCost Free { get; } = new([]);

    public IReadOnlyDictionary<ResourceKind, long> Entries => _entries;

    public static ResourceCost Of(params (ResourceKind Kind, long Amount)[] entries)
    {
        ArgumentNullException.ThrowIfNull(entries);

        var amounts = new Dictionary<ResourceKind, long>();

        foreach (var (kind, amount) in entries)
        {
            ArgumentOutOfRangeException.ThrowIfNegativeOrZero(amount, nameof(entries));

            if (!amounts.TryAdd(kind, amount))
            {
                throw new ArgumentException(
                    $"Resource {kind} is listed twice in the same cost.", nameof(entries));
            }
        }

        return new ResourceCost(amounts);
    }
}
