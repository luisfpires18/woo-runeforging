namespace Woo.Api.Features.Settlements;

/// <summary>
/// The kingdom a settlement belongs to.
/// </summary>
/// <remarks>
/// Only Arkazia exists so far. Canon defines seven kingdoms and makes Arkazia
/// versus Sylvara the first border, but a member with no content behind it
/// would be an unused abstraction: Sylvara joins when the first opposing force
/// does.
///
/// Persisted as a string, never as an ordinal.
/// </remarks>
public enum Kingdom
{
    Arkazia,
}
