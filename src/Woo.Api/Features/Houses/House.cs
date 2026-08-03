using Woo.Api.Features.Resources;
using Woo.Api.Features.Settlements;

namespace Woo.Api.Features.Houses;

/// <summary>
/// A minor House: the player's identity, its one settlement and its resources.
/// This is the aggregate everything else will hang from.
/// </summary>
/// <remarks>
/// Specialists, the forge and its techniques, companies, equipment, contracts
/// and history all belong to the House in the finished game. None of them is
/// modelled yet.
/// </remarks>
public sealed class House
{
    private House()
    {
        // EF Core materialisation.
    }

    private House(Guid id, string name, Kingdom kingdom, Settlement settlement, ResourcePool resources)
    {
        Id = id;
        Name = name;
        Kingdom = kingdom;
        Settlement = settlement;
        Resources = resources;
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public Kingdom Kingdom { get; private set; }

    public Settlement Settlement { get; private set; } = null!;

    public ResourcePool Resources { get; private set; } = null!;

    public static House Establish(
        Guid id,
        string name,
        Kingdom kingdom,
        Settlement settlement,
        ResourcePool resources)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentNullException.ThrowIfNull(settlement);
        ArgumentNullException.ThrowIfNull(resources);

        return new House(id, name, kingdom, settlement, resources);
    }

    /// <summary>
    /// Reserves nothing and pays everything: the cost is spent in full, or the
    /// construction does not start and no balance changes.
    /// </summary>
    /// <remarks>
    /// Reservations, worker assignment and construction slots arrive with
    /// authoritative construction (Prompt 11).
    /// </remarks>
    /// <exception cref="InsufficientResourcesException">
    /// The House cannot afford the cost. Nothing is spent and nothing starts.
    /// </exception>
    public void BeginConstruction(
        BuildingKind kind,
        ResourceCost cost,
        TimeSpan duration,
        DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(cost);

        // Ask the building first: a second start on a completed building must
        // not spend resources before it is rejected.
        var building = Settlement.BuildingOf(kind);

        if (building.Status != ConstructionStatus.NotBuilt)
        {
            throw new InvalidConstructionStateException(
                kind, $"cannot begin construction from {building.Status}.");
        }

        Resources.Spend(cost);
        Settlement.BeginConstruction(kind, now, duration);
    }

    /// <summary>
    /// Completes a due construction. A building cannot complete twice.
    /// </summary>
    public void CompleteConstruction(BuildingKind kind, DateTimeOffset now) =>
        Settlement.CompleteConstruction(kind, now);
}
