namespace Woo.Api.Features.Settlements;

/// <summary>
/// How far a settlement has grown.
/// </summary>
/// <remarks>
/// Only the Outpost exists. Canon and the workbase describe Village, Fortified
/// Town, Regional Capital and the late Runic Seat capability layer; each joins
/// when a prompt makes it reachable, rather than sitting here unreachable.
///
/// Persisted as a string, never as an ordinal.
/// </remarks>
public enum SettlementStage
{
    Outpost,
}
