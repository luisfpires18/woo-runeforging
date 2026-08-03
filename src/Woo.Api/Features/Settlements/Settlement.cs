namespace Woo.Api.Features.Settlements;

/// <summary>
/// The single settlement a House develops. One House, one settlement: it grows
/// in place rather than spawning more.
/// </summary>
public sealed class Settlement
{
    private readonly List<Building> _buildings = [];

    private Settlement()
    {
        // EF Core materialisation.
    }

    private Settlement(Guid id, string name)
    {
        Id = id;
        Name = name;

        // A settlement knows about every building it could raise; each starts
        // NotBuilt. That keeps "which buildings exist" a content question, not
        // a persistence one.
        _buildings.AddRange(Enum.GetValues<BuildingKind>().Select(Building.NotBuilt));
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public SettlementStage Stage { get; private set; } = SettlementStage.Outpost;

    public IReadOnlyList<Building> Buildings => _buildings;

    public static Settlement FoundOutpost(Guid id, string name)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        return new Settlement(id, name);
    }

    public Building BuildingOf(BuildingKind kind) =>
        _buildings.SingleOrDefault(building => building.Kind == kind)
        ?? throw new InvalidOperationException(
            $"The settlement has no {kind}. Every building kind is present from founding.");

    internal void BeginConstruction(BuildingKind kind, DateTimeOffset now, TimeSpan duration) =>
        BuildingOf(kind).BeginConstruction(now, duration);

    internal void CompleteConstruction(BuildingKind kind, DateTimeOffset now) =>
        BuildingOf(kind).Complete(now);
}
