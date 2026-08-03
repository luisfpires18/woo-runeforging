using Microsoft.EntityFrameworkCore;
using Woo.Api.Features.Houses;

namespace Woo.Api.Persistence;

/// <summary>
/// The single EF Core context for the whole application. One context, one
/// connection, one transaction scope, one migration history.
/// </summary>
/// <remarks>
/// It maps the House aggregate only — House, its settlement, that settlement's
/// buildings, and its resource balances. Forging, armies and battles are not
/// modelled yet and so have nothing to persist.
/// </remarks>
public sealed class WooDbContext(DbContextOptions<WooDbContext> options) : DbContext(options)
{
    public DbSet<House> Houses => Set<House>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(WooDbContext).Assembly);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        ArgumentNullException.ThrowIfNull(configurationBuilder);

        // Every enum is stored as its name, never its ordinal. Inserting or
        // reordering a member would silently re-point existing rows at the
        // wrong value, and an ordinal tells a support query nothing. Applied as
        // a convention so a new enum cannot be mapped as an int by omission.
        configurationBuilder.Properties<Enum>().HaveConversion<string>();
    }
}
