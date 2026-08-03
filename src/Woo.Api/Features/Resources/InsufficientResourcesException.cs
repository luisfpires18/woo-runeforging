namespace Woo.Api.Features.Resources;

/// <summary>
/// Thrown when a spend would take a balance below zero. Callers that can
/// reasonably expect a shortage should ask <see cref="ResourcePool.CanAfford"/>
/// first; reaching this exception means an invariant was about to break.
/// </summary>
public sealed class InsufficientResourcesException(ResourceKind kind, long required, long available)
    : InvalidOperationException(
        $"Not enough {kind}: {required} required, {available} available. " +
        "Resources can never fall below zero.")
{
    public ResourceKind Kind { get; } = kind;

    public long Required { get; } = required;

    public long Available { get; } = available;
}
