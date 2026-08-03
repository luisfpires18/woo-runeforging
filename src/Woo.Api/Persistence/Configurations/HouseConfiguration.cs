using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Woo.Api.Features.Houses;
using Woo.Api.Features.Resources;
using Woo.Api.Features.Settlements;

namespace Woo.Api.Persistence.Configurations;

/// <summary>
/// Maps the House aggregate. The whole graph is configured in one place because
/// it is one aggregate: a settlement or a balance has no life of its own, and
/// splitting the configuration would only hide that.
/// </summary>
/// <remarks>
/// The domain types carry no EF attributes. Everything the database needs to
/// know lives here, which is what keeps those types testable with no database.
/// </remarks>
public sealed class HouseConfiguration : IEntityTypeConfiguration<House>
{
    public void Configure(EntityTypeBuilder<House> builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.ToTable("Houses");
        builder.HasKey(house => house.Id);

        builder.Property(house => house.Name).HasMaxLength(200).IsRequired();
        builder.Property(house => house.Kingdom).HasMaxLength(50).IsRequired();

        builder.OwnsOne(house => house.Settlement, ConfigureSettlement);
        builder.OwnsOne(house => house.Resources, ConfigureResources);

        builder.Navigation(house => house.Settlement).IsRequired();
        builder.Navigation(house => house.Resources).IsRequired();
    }

    private static void ConfigureSettlement(OwnedNavigationBuilder<House, Settlement> settlement)
    {
        settlement.ToTable("Settlements");
        settlement.WithOwner().HasForeignKey("HouseId");
        settlement.HasKey(s => s.Id);

        settlement.Property(s => s.Name).HasMaxLength(200).IsRequired();
        settlement.Property(s => s.Stage).HasMaxLength(50).IsRequired();

        settlement.OwnsMany(s => s.Buildings, ConfigureBuildings);
        settlement.Navigation(s => s.Buildings).UsePropertyAccessMode(PropertyAccessMode.Field);
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

    private static void ConfigureResources(OwnedNavigationBuilder<House, ResourcePool> resources)
    {
        // The pool itself holds no columns; it exists to own the balances and
        // to enforce the spend rule.
        resources.OwnsMany(pool => pool.Balances, ConfigureBalances);
        resources.Navigation(pool => pool.Balances).UsePropertyAccessMode(PropertyAccessMode.Field);
    }

    private static void ConfigureBalances(OwnedNavigationBuilder<ResourcePool, ResourceBalance> balance)
    {
        balance.ToTable("ResourceBalances");
        balance.WithOwner().HasForeignKey("HouseId");

        balance.Property(b => b.Kind).HasMaxLength(50).IsRequired();

        // Whole numbers only — no floating point anywhere in the economy.
        balance.Property(b => b.Amount).HasColumnType("bigint").IsRequired();

        balance.HasKey("HouseId", nameof(ResourceBalance.Kind));
    }
}
