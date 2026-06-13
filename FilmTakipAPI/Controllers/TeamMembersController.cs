using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FilmTakipAPI.Data;
using FilmTakipAPI.Entities.ProjectManagement;

namespace FilmTakipAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TeamMembersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TeamMembersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TeamMember>>> GetMembers()
        {
            return await _context.TeamMembers.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<TeamMember>> CreateMember(TeamMember member)
        {
            _context.TeamMembers.Add(member);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMembers), new { id = member.Id }, member);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMember(int id)
        {
            var member = await _context.TeamMembers.FindAsync(id);

            if (member == null)
                return NotFound();

            _context.TeamMembers.Remove(member);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}