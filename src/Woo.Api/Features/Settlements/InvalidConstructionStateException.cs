namespace Woo.Api.Features.Settlements;

/// <summary>
/// Thrown when a construction transition is not legal from the building's
/// current state — most importantly, when something tries to complete a
/// building that is already complete.
/// </summary>
public sealed class InvalidConstructionStateException(BuildingKind kind, string reason)
    : InvalidOperationException($"{kind}: {reason}")
{
    public BuildingKind Kind { get; } = kind;
}
