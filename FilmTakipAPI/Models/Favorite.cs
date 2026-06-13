namespace FilmTakipAPI.Models
{
    public class Favorite
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int MovieId { get; set; }
    }
}