using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Woo.Api.Features.Resources;
using Woo.Api.Features.Settlements;

namespace Woo.Api.Persistence.Configurations;

/// <summary>
/// Maps the Settlement aggregate. The whole graph is configured in one place
/// because it is one aggregate: a building or a balance has no life of its own,
/// and splitting the configuration would only hide that.
/// </summary>
/// <remarks>
/// The domain types carry no EF attributes. Everything the database needs to
/// know lives here, which is what keeps those types testable with no database.
/// </remarks>
public sealed class SettlementConfiguration : IEntityTypeConfiguration<Settlement>
{
    public void Configure(EntityTypeBuilder<Settlement> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("Settlements");
        builder.HasKey(settlement => settlement.Id);

        builder.Property(settlement => settlement.Name).HasMaxLength(200).IsRequired();
        builder.Property(settlement => settlement.Kingdom).HasMaxLength(50).IsRequired();
        builder.Property(settlement => settlement.Stage).HasMaxLength(50).IsRequired();

        builder.OwnsMany(settlement => settlement.Buildings, ConfigureBuildings);
        builder.Navigation(settlement => settlement.Buildings)
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.OwnsOne(settlement => settlement.Resources, ConfigureResources);
        builder.Navigation(settlement => settlement.Resources).IsRequired();
    }

    private static void ConfigureBuildings(OwnedNavigationBuilder<Settlement, Building> building)
    {
        building.ToTable("Buildings");
        building.WithOwner().HasForeignKey("SettlementId");

        building.Property(b => b.Kind).HasMaxLength(50).IsRequired();
        building.Property(b => b.Status).HasMaxLength(50).IsRequired();

        // One row per building per settlement: the kind is the identity.
        building.HasKey("SettlementId", nameof(Building.Kind));
    }

    private static void ConfigureResources(
        OwnedNavigationBuilder<Settlement, ResourcePool> resources)
    {
        // The pool itself holds no columns; it exists to own the balances and
        // to enforce the spend rule.
        resources.OwnsMany(pool => pool.Balances, ConfigureBalances);
        resources.Navigation(pool => pool.Balances).UsePropertyAccessMode(PropertyAccessMode.Field);
    }

    private static void ConfigureBalances(
        OwnedNavigationBuilder<ResourcePool, ResourceBalance> balance)
    {
        balance.ToTable("ResourceBalances");
        balance.WithOwner().HasForeignKey("SettlementId");

        balance.Property(b => b.Kind).HasMaxLength(50).IsRequired();

        // Whole numbers only — no floating point anywhere in the economy.
        balance.Property(b => b.Amount).HasColumnType("bigint").IsRequired();

        balance.HasKey("SettlementId", nameof(ResourceBalance.Kind));
    }
}
