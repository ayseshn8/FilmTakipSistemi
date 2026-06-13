using System;

namespace FilmTakipAPI.Entities.ProjectManagement
{
    public class ProjectTask
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty; // e.g., "To Do", "In Progress", "Done"

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public int Progress { get; set; } // 0 to 100

        public int? AssignedMemberId { get; set; }
        public TeamMember? AssignedMember { get; set; }

        public int? PredecessorId { get; set; }
        public ProjectTask? Predecessor { get; set; }

        public decimal Cost { get; set; }
    }
}