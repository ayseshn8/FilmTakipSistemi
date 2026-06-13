using Microsoft.EntityFrameworkCore;
using FilmTakipAPI.Models;
using System.Collections.Generic;
using FilmTakipAPI.Entities.ProjectManagement;


namespace FilmTakipAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Movie> Movies { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Rating> Ratings { get; set; }
        public DbSet<Favorite> Favorites { get; set; }

        public DbSet<ProjectTask> ProjectTasks { get; set; }

        public DbSet<TeamMember> TeamMembers { get; set; }

        public DbSet<Budget> Budgets { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ProjectTask>()
                .HasOne(t => t.AssignedMember)
                .WithMany()
                .HasForeignKey(t => t.AssignedMemberId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<ProjectTask>()
                .HasOne(t => t.Predecessor)
                .WithMany()
                .HasForeignKey(t => t.PredecessorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}