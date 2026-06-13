using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FilmTakipAPI.Data;
using FilmTakipAPI.Entities.ProjectManagement;

namespace FilmTakipAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BudgetsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BudgetsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Tüm bütçe kayıtlarını listeler
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Budget>>> GetBudgets()
        {
            return await _context.Budgets.ToListAsync();
        }

        // ID değerine göre bütçe getirir
        [HttpGet("{id}")]
        public async Task<ActionResult<Budget>> GetBudget(int id)
        {
            var budget = await _context.Budgets.FindAsync(id);

            if (budget == null)
                return NotFound();

            return budget;
        }

        // Yeni bütçe kaydı oluşturur
        [HttpPost]
        public async Task<ActionResult<Budget>> CreateBudget(Budget budget)
        {
            _context.Budgets.Add(budget);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBudget), new { id = budget.Id }, budget);
        }

        // Mevcut bütçe kaydını günceller
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBudget(int id, Budget budget)
        {
            if (id != budget.Id)
                return BadRequest();

            _context.Entry(budget).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Bütçe kaydını siler
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBudget(int id)
        {
            var budget = await _context.Budgets.FindAsync(id);

            if (budget == null)
                return NotFound();

            _context.Budgets.Remove(budget);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Frontend'deki grafik veya kartlar için bütçe özetini hesaplar
        [HttpGet("summary")]
        public async Task<IActionResult> Summary()
        {
            var budget = await _context.Budgets.FirstOrDefaultAsync();

            // Eğer veritabanında hiç bütçe girilmemişse, hata vermek yerine 0 döner
            if (budget == null)
            {
                return Ok(new
                {
                    PlannedBudget = 0,
                    SpentBudget = 0,
                    RemainingBudget = 0
                });
            }

            return Ok(new
            {
                PlannedBudget = budget.PlannedBudget,
                SpentBudget = budget.SpentBudget,
                RemainingBudget = budget.PlannedBudget - budget.SpentBudget
            });
        }
    }
}