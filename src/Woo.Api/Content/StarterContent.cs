using Woo.Api.Features.Resources;
using Woo.Api.Features.Settlements;

namespace Woo.Api.Content;

/// <summary>
/// The opening position: one Arkazian frontier outpost.
/// </summary>
/// <remarks>
/// <para>
/// The settlement has <b>no proper name</b>. Canon names Arkazia's capital as
/// Obsidia and describes the kingdom's mountain holds, but it names no minor
/// settlement — so rather than invent one, the outpost is described by what it
/// is. Naming it is the player's to do later.
/// </para>
/// <para>
/// Opening balances are enough to raise the first two or three buildings
/// without waiting, and not enough to raise all five. That is the first
/// decision the player makes.
/// </para>
/// </remarks>
public static class StarterContent
{
    public const string SettlementName = "Arkazian Outpost";

    public const Kingdom SettlementKingdom = Kingdom.Arkazia;

    public static ResourcePool OpeningResources() => ResourcePool.With(
        (ResourceKind.Gold, 250),
        (ResourceKind.Provisions, 200),
        (ResourceKind.Timber, 220),
        (ResourceKind.Stone, 180),
        (ResourceKind.Ore, 120),
        (ResourceKind.WorkshopSupplies, 100));

    /// <summary>
    /// Builds the opening settlement. The caller supplies the identifier so
    /// that nothing here reaches for a random number or a clock.
    /// </summary>
    public static Settlement FoundStarterSettlement(Guid settlementId) =>
        Settlement.FoundOutpost(
            settlementId,
            SettlementName,
            SettlementKingdom,
            OpeningResources());
}
