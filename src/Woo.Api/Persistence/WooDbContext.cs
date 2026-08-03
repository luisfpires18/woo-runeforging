using Microsoft.EntityFrameworkCore;

namespace Woo.Api.Persistence;

/// <summary>
/// The single EF Core context for the whole application. One context, one
/// connection, one transaction scope, one migration history.
///
/// It deliberately declares no entity types yet: Prompt 2 establishes
/// connectivity only. The first entities and the first migration arrive with
/// the Foundations of Iron domain model in Prompt 3.
/// </summary>
public sealed class WooDbContext(DbContextOptions<WooDbContext> options) : DbContext(options);
