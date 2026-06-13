using System;

namespace FilmTakipAPI.Entities.ProjectManagement
{
    public class Budget
    {
        public int Id { get; set; }

        public decimal PlannedBudget { get; set; }

        public decimal SpentBudget { get; set; }
    }
}