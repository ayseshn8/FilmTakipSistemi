namespace FilmTakipAPI.Models
{
    public class Comment
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int MovieId { get; set; }

        public string CommentText { get; set; }
    }
}
