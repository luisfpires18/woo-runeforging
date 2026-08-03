using Woo.Api.Features.Houses;
using Woo.Api.Features.Resources;
using Woo.Api.Features.Settlements;

namespace Woo.Api.Content;

/// <summary>
/// The opening position: one minor Arkazian House with a frontier outpost.
/// </summary>
/// <remarks>
/// <para>
/// The House and outpost names below are <b>invented starter content, not
/// canon</b>. The canon names Arkazia's capital as Obsidia and describes the
/// kingdom's mountain holds, but it names no minor House — so these are
/// placeholders chosen to sound Arkazian, and replacing them breaks nothing.
/// </para>
/// <para>
/// Opening balances are enough to raise the first two or three buildings
/// without waiting, and not enough to raise all five. That is the first
/// decision the player makes.
/// </para>
/// </remarks>
public static class StarterContent
{
    public const string HouseName = "House Karrow";

    public const string OutpostName = "Ashen Reach";

    public const Kingdom HouseKingdom = Kingdom.Arkazia;

    public static ResourcePool OpeningResources() => ResourcePool.With(
        (ResourceKind.Gold, 250),
        (ResourceKind.Provisions, 200),
        (ResourceKind.Timber, 220),
        (ResourceKind.Stone, 180),
        (ResourceKind.Ore, 120),
        (ResourceKind.WorkshopSupplies, 100));

    /// <summary>
    /// Builds the opening House. The caller supplies the identifiers so that
    /// nothing here reaches for a random number or a clock.
    /// </summary>
    public static House EstablishStarterHouse(Guid houseId, Guid settlementId) =>
        House.Establish(
            houseId,
            HouseName,
            HouseKingdom,
            Settlement.FoundOutpost(settlementId, OutpostName),
            OpeningResources());
}
