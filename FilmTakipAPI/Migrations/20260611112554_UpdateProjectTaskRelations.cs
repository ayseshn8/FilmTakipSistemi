using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FilmTakipAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProjectTaskRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AssignedMemberId",
                table: "ProjectTasks",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Cost",
                table: "ProjectTasks",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "PredecessorId",
                table: "ProjectTasks",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTasks_AssignedMemberId",
                table: "ProjectTasks",
                column: "AssignedMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTasks_PredecessorId",
                table: "ProjectTasks",
                column: "PredecessorId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectTasks_ProjectTasks_PredecessorId",
                table: "ProjectTasks",
                column: "PredecessorId",
                principalTable: "ProjectTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectTasks_TeamMembers_AssignedMemberId",
                table: "ProjectTasks",
                column: "AssignedMemberId",
                principalTable: "TeamMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectTasks_ProjectTasks_PredecessorId",
                table: "ProjectTasks");

            migrationBuilder.DropForeignKey(
                name: "FK_ProjectTasks_TeamMembers_AssignedMemberId",
                table: "ProjectTasks");

            migrationBuilder.DropIndex(
                name: "IX_ProjectTasks_AssignedMemberId",
                table: "ProjectTasks");

            migrationBuilder.DropIndex(
                name: "IX_ProjectTasks_PredecessorId",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "AssignedMemberId",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "Cost",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "PredecessorId",
                table: "ProjectTasks");
        }
    }
}
