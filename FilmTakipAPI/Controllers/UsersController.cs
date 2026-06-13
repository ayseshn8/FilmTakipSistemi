using FilmTakipAPI.Data;
using FilmTakipAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace FilmTakipAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetUsers()
        {
            return Ok(_context.Users.ToList());
        }

        [HttpPost]
        public IActionResult AddUser(User user)
        {
            _context.Users.Add(user);

            _context.SaveChanges();

            return Ok(user);
        }
    }
}
