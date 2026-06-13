using FilmTakipAPI.Data;
using FilmTakipAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace FilmTakipAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FavoritesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FavoritesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetFavorites()
        {
            return Ok(_context.Favorites.ToList());
        }

        [HttpPost]
        public IActionResult AddFavorite(Favorite favorite)
        {
            _context.Favorites.Add(favorite);

            _context.SaveChanges();

            return Ok(favorite);
        }
    }
}
