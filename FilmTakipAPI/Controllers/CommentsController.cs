using FilmTakipAPI.Data;
using FilmTakipAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace FilmTakipAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CommentsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetComments()
        {
            return Ok(_context.Comments.ToList());
        }

        [HttpPost]
        public IActionResult AddComment(Comment comment)
        {
            _context.Comments.Add(comment);

            _context.SaveChanges();

            return Ok(comment);
        }
    }
}
