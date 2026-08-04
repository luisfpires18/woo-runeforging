using Woo.Api.Features.Resources;

namespace Woo.Api.Features.Settlements;

/// <summary>
/// The player's settlement: its identity, its buildings and its resources.
/// This is the aggregate everything else will hang from.
/// </summary>
/// <remarks>
/// <para>
/// One player, one settlement: it grows in place rather than spawning more.
/// That used to be a rule enforced between two types — a House owning exactly
/// one Settlement — and is now simply the shape of the model.
/// </para>
/// <para>
/// Specialists, the forge and its techniques, companies, equipment, contracts
/// and history all belong to the settlement in the finished game. None of them
/// is modelled yet.
/// </para>
/// </remarks>
public sealed class Settlement
{
    private readonly List<Building> _buildings = [];

    private Settlement()
    {
        // EF Core materialisation.
    }

    private Settlement(Guid id, string name, Kingdom kingdom, ResourcePool resources)
    {
        Id = id;
        Name = name;
        Kingdom = kingdom;
        Resources = resources;

        // A settlement knows about every building it could raise; each starts
        // NotBuilt. That keeps "which buildings exist" a content question, not
        // a persistence one.
        _buildings.AddRange(Enum.GetValues<BuildingKind>().Select(Building.NotBuilt));
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public Kingdom Kingdom { get; private set; }

    public SettlementStage Stage { get; private set; } = SettlementStage.Outpost;

    public ResourcePool Resources { get; private set; } = null!;

    public IReadOnlyList<Building> Buildings => _buildings;

    public static Settlement FoundOutpost(
        Guid id,
        string name,
        Kingdom kingdom,
        ResourcePool resources)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentNullException.ThrowIfNull(resources);

        return new Settlement(id, name, kingdom, resources);
    }

    public Building BuildingOf(BuildingKind kind) =>
        _buildings.SingleOrDefault(building => building.Kind == kind)
        ?? throw new InvalidOperationException(
            $"The settlement has no {kind}. Every building kind is present from founding.");

    /// <summary>
    /// Reserves nothing and pays everything: the cost is spent in full, or the
    /// construction does not start and no balance changes.
    /// </summary>
    /// <remarks>
    /// Reservations, worker assignment and construction slots arrive with
    /// authoritative construction (Prompt 11).
    /// </remarks>
    /// <exception cref="InsufficientResourcesException">
    /// The settlement cannot afford the cost. Nothing is spent, nothing starts.
    /// </exception>
    /// <exception cref="ArgumentOutOfRangeException">
    /// The duration is zero or negative. Nothing is spent and nothing starts.
    /// </exception>
    public void BeginConstruction(
        BuildingKind kind,
        ResourceCost cost,
        TimeSpan duration,
        DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(cost);

        // Everything that can reject this call is checked before anything is
        // spent, so a rejected start always leaves the settlement exactly as it
        // was. Validating the duration inside Building would be too late: the
        // cost would already be gone.
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(duration, TimeSpan.Zero);

        var building = BuildingOf(kind);

        if (building.Status != ConstructionStatus.NotBuilt)
        {
            throw new InvalidConstructionStateException(
                kind, $"cannot begin construction from {building.Status}.");
        }

        Resources.Spend(cost);
        building.BeginConstruction(now, duration);
    }

    /// <summary>
    /// Completes a due construction. A building cannot complete twice.
    /// </summary>
    public void CompleteConstruction(BuildingKind kind, DateTimeOffset now) =>
        BuildingOf(kind).Complete(now);
}
