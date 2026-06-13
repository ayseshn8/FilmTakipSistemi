namespace FilmTakipAPI.Models
{
    public class Movie
    {
        public int Id { get; set; }

        public string Title { get; set; }

        public string Description { get; set; }

        public int ReleaseYear { get; set; }

        public string Genre { get; set; }

        public string ImageUrl { get; set; }
    }
}
