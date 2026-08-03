namespace Woo.Api.Features.Settlements;

/// <summary>
/// One building in a settlement, and its construction state.
/// </summary>
/// <remarks>
/// <para>
/// Progress is <b>stored timestamps read on demand</b>, not a timer. Nothing
/// fires when a building becomes due: the row records when work started and
/// when it is due, and whoever reads or writes the settlement resolves it by
/// passing the current time. A House left alone for three days has three days
/// of work resolved on its next read.
/// </para>
/// <para>
/// What a completed building <i>does</i> — storage capacity, production rates,
/// unlocked capabilities — is not modelled yet.
/// </para>
/// </remarks>
public sealed class Building
{
    private Building()
    {
        // EF Core materialisation.
    }

    private Building(BuildingKind kind) => Kind = kind;

    public BuildingKind Kind { get; private set; }

    public ConstructionStatus Status { get; private set; } = ConstructionStatus.NotBuilt;

    public DateTimeOffset? StartedAtUtc { get; private set; }

    public DateTimeOffset? CompletesAtUtc { get; private set; }

    public DateTimeOffset? CompletedAtUtc { get; private set; }

    internal static Building NotBuilt(BuildingKind kind) => new(kind);

    /// <summary>
    /// Whether the construction is due, given the time supplied by the caller.
    /// </summary>
    public bool IsDueAt(DateTimeOffset now) =>
        Status == ConstructionStatus.UnderConstruction && now >= CompletesAtUtc;

    internal void BeginConstruction(DateTimeOffset now, TimeSpan duration)
    {
        if (Status != ConstructionStatus.NotBuilt)
        {
            throw new InvalidConstructionStateException(
                Kind, $"cannot begin construction from {Status}.");
        }

        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(duration, TimeSpan.Zero);

        Status = ConstructionStatus.UnderConstruction;
        StartedAtUtc = now;
        CompletesAtUtc = now + duration;
    }

    /// <summary>
    /// Completes the construction. <b>A building cannot complete twice</b>, and
    /// cannot complete before it is due.
    /// </summary>
    internal void Complete(DateTimeOffset now)
    {
        if (Status == ConstructionStatus.Complete)
        {
            throw new InvalidConstructionStateException(
                Kind, "is already complete; a construction cannot complete twice.");
        }

        if (Status != ConstructionStatus.UnderConstruction)
        {
            throw new InvalidConstructionStateException(
                Kind, $"cannot complete from {Status}; it is not under construction.");
        }

        if (now < CompletesAtUtc)
        {
            throw new InvalidConstructionStateException(
                Kind, $"is not due until {CompletesAtUtc:O}; asked at {now:O}.");
        }

        Status = ConstructionStatus.Complete;
        CompletedAtUtc = now;
    }
}
