using FilmTakipAPI.Data;
using FilmTakipAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace FilmTakipAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RatingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RatingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetRatings()
        {
            return Ok(_context.Ratings.ToList());
        }

        [HttpPost]
        public IActionResult AddRating(Rating rating)
        {
            _context.Ratings.Add(rating);

            _context.SaveChanges();

            return Ok(rating);
        }
    }
}
