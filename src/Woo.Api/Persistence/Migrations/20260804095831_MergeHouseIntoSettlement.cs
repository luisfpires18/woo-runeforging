using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Woo.Api.Persistence.Migrations
{
    /// <summary>
    /// Folds the House aggregate into the Settlement it owned.
    /// </summary>
    /// <remarks>
    /// <para>
    /// A House owned exactly one Settlement, so the two were always one thing
    /// wearing two names. The Settlement becomes the aggregate root and keeps
    /// its own <c>Id</c>; <c>Houses</c> disappears.
    /// </para>
    /// <para>
    /// <b>Written by hand, replacing the scaffolded body.</b> The scaffolder
    /// dropped <c>Houses</c> before reading anything out of it and renamed
    /// <c>ResourceBalances.HouseId</c> straight to <c>SettlementId</c>, which
    /// would have left every balance pointing at a house id that no longer
    /// identifies anything. Order matters here: each value reaches its
    /// destination before the column it came from is dropped, and
    /// <c>Houses</c> goes last, once nothing references it.
    /// </para>
    /// <para>
    /// <c>Buildings</c> was already keyed on <c>SettlementId</c> and needs no
    /// re-pointing — but <c>Buildings.Kind</c> is persisted as a string, so the
    /// <c>HouseHall</c> to <c>CommandHall</c> rename has to move the stored
    /// values too, or materialisation breaks on the next read.
    /// </para>
    /// <para>
    /// <b>Down is lossy in exactly one place.</b> The settlement's original
    /// name cannot be recovered — Up deliberately discards it in favour of
    /// "Arkazian Outpost" — so Down restores the House name and leaves the
    /// settlement named as Up left it. Everything else round-trips.
    /// </para>
    /// </remarks>
    public partial class MergeHouseIntoSettlement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            ArgumentNullException.ThrowIfNull(migrationBuilder);

            // 1. Kingdom moves onto the settlement. Nullable first, so existing
            //    rows survive the add and can be backfilled.
            migrationBuilder.AddColumn<string>(
                name: "Kingdom",
                table: "Settlements",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "Settlements" AS s
                SET "Kingdom" = h."Kingdom"
                FROM "Houses" AS h
                WHERE s."HouseId" = h."Id";
                """);

            migrationBuilder.AlterColumn<string>(
                name: "Kingdom",
                table: "Settlements",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);

            // 2. The settlement is described by what it is. "House Karrow" is
            //    not copied across: it is the value being retired.
            migrationBuilder.Sql(
                """
                UPDATE "Settlements" SET "Name" = 'Arkazian Outpost';
                """);

            // 3. BuildingKind.HouseHall was renamed to CommandHall, and the
            //    enum is stored by name.
            migrationBuilder.Sql(
                """
                UPDATE "Buildings" SET "Kind" = 'CommandHall' WHERE "Kind" = 'HouseHall';
                """);

            // 4. Balances re-point from the House to the Settlement. The join
            //    goes through Settlements.HouseId, which still exists at this
            //    point — that is why step 5 comes after this one.
            migrationBuilder.AddColumn<Guid>(
                name: "SettlementId",
                table: "ResourceBalances",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE "ResourceBalances" AS rb
                SET "SettlementId" = s."Id"
                FROM "Settlements" AS s
                WHERE rb."HouseId" = s."HouseId";
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "SettlementId",
                table: "ResourceBalances",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.DropForeignKey(
                name: "FK_ResourceBalances_Houses_HouseId",
                table: "ResourceBalances");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ResourceBalances",
                table: "ResourceBalances");

            migrationBuilder.DropColumn(
                name: "HouseId",
                table: "ResourceBalances");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ResourceBalances",
                table: "ResourceBalances",
                columns: ["SettlementId", "Kind"]);

            migrationBuilder.AddForeignKey(
                name: "FK_ResourceBalances_Settlements_SettlementId",
                table: "ResourceBalances",
                column: "SettlementId",
                principalTable: "Settlements",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // 5. The settlement stops belonging to anything.
            migrationBuilder.DropForeignKey(
                name: "FK_Settlements_Houses_HouseId",
                table: "Settlements");

            migrationBuilder.DropIndex(
                name: "IX_Settlements_HouseId",
                table: "Settlements");

            migrationBuilder.DropColumn(
                name: "HouseId",
                table: "Settlements");

            // 6. Nothing references Houses now.
            migrationBuilder.DropTable(name: "Houses");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            ArgumentNullException.ThrowIfNull(migrationBuilder);

            migrationBuilder.CreateTable(
                name: "Houses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Kingdom = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Houses", x => x.Id);
                });

            migrationBuilder.AddColumn<Guid>(
                name: "HouseId",
                table: "Settlements",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            // The relationship was one to one, so the settlement's own id is a
            // free, deterministic house id — no uuid generation needed, and the
            // join back to the balances stays trivial.
            migrationBuilder.Sql(
                """
                INSERT INTO "Houses" ("Id", "Name", "Kingdom")
                SELECT s."Id", 'House Karrow', s."Kingdom" FROM "Settlements" AS s;
                """);

            migrationBuilder.Sql(
                """
                UPDATE "Settlements" SET "HouseId" = "Id";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Settlements_HouseId",
                table: "Settlements",
                column: "HouseId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Settlements_Houses_HouseId",
                table: "Settlements",
                column: "HouseId",
                principalTable: "Houses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddColumn<Guid>(
                name: "HouseId",
                table: "ResourceBalances",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.Sql(
                """
                UPDATE "ResourceBalances" SET "HouseId" = "SettlementId";
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_ResourceBalances_Settlements_SettlementId",
                table: "ResourceBalances");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ResourceBalances",
                table: "ResourceBalances");

            migrationBuilder.DropColumn(
                name: "SettlementId",
                table: "ResourceBalances");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ResourceBalances",
                table: "ResourceBalances",
                columns: ["HouseId", "Kind"]);

            migrationBuilder.AddForeignKey(
                name: "FK_ResourceBalances_Houses_HouseId",
                table: "ResourceBalances",
                column: "HouseId",
                principalTable: "Houses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.Sql(
                """
                UPDATE "Buildings" SET "Kind" = 'HouseHall' WHERE "Kind" = 'CommandHall';
                """);

            migrationBuilder.DropColumn(
                name: "Kingdom",
                table: "Settlements");
        }
    }
}
