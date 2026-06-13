using FilmTakipAPI.Data;
using FilmTakipAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace FilmTakipAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MoviesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MoviesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetMovies()
        {
            return Ok(_context.Movies.ToList());
        }

        [HttpPost]
        public IActionResult AddMovie(Movie movie)
        {
            _context.Movies.Add(movie);
            _context.SaveChanges();

            return Ok(movie);
        }
        [HttpPut("{id}")]
        public IActionResult UpdateMovie(int id, Movie updatedMovie)
        {
            var movie = _context.Movies.Find(id);

            if (movie == null)
                return NotFound();

            movie.Title = updatedMovie.Title;
            movie.Description = updatedMovie.Description;
            movie.ReleaseYear = updatedMovie.ReleaseYear;
            movie.Genre = updatedMovie.Genre;
            movie.ImageUrl = updatedMovie.ImageUrl;

            _context.SaveChanges();

            return Ok(movie);
        }
        [HttpDelete("{id}")]
        public IActionResult DeleteMovie(int id)
        {
            var movie = _context.Movies.Find(id);

            if (movie == null)
                return NotFound();

            _context.Movies.Remove(movie);

            _context.SaveChanges();

            return Ok("Film silindi");
        }
        [HttpGet("stats")]
        public IActionResult GetMovieStats()
        {
            var result = _context.Movies.Select(m => new
            {
                m.Id,
                m.Title,
                AverageRating =
                    _context.Ratings
                    .Where(r => r.MovieId == m.Id)
                    .Average(r => (double?)r.Score) ?? 0
            });

            return Ok(result);
        }
        [HttpGet("{id}")]
        public IActionResult GetMovie(int id)
        {
            var movie = _context.Movies.Find(id);

            if (movie == null)
                return NotFound();

            return Ok(movie);
        }
    }
}
