namespace Woo.Api.Features.Resources;

/// <summary>
/// How much of one resource a House holds. Quantities are whole numbers —
/// there is no floating point anywhere in the economy.
/// </summary>
public sealed class ResourceBalance
{
    // Storage capacity and elapsed-time accrual arrive with authoritative
    // resources (Prompt 10); a balance is only an amount today.

    private ResourceBalance()
    {
        // EF Core materialisation.
    }

    internal ResourceBalance(ResourceKind kind, long amount)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(amount);

        Kind = kind;
        Amount = amount;
    }

    public ResourceKind Kind { get; private set; }

    public long Amount { get; private set; }

    internal void Add(long amount)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(amount);

        Amount += amount;
    }

    internal void Deduct(long amount)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(amount);

        if (amount > Amount)
        {
            throw new InsufficientResourcesException(Kind, amount, Amount);
        }

        Amount -= amount;
    }
}
