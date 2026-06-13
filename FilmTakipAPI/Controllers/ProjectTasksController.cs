using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FilmTakipAPI.Data;
using FilmTakipAPI.Entities.ProjectManagement;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;

namespace FilmTakipAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectTasksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProjectTasksController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1. Projenin genel ilerleme durumunu (ortalama) hesaplar
        [HttpGet("progress")]
        public async Task<IActionResult> GetProgress()
        {
            var hasTasks = await _context.ProjectTasks.AnyAsync();

            if (!hasTasks)
                return Ok(0);

            var average = await _context.ProjectTasks.AverageAsync(x => x.Progress);

            return Ok(Math.Round(average, 1));
        }

        // 2. Tüm görevleri listeler (Frontend için düzleştirilmiş DTO formatında)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetProjectTasks()
        {
            var tasks = await _context.ProjectTasks
                .Include(t => t.AssignedMember)
                .Include(t => t.Predecessor)
                .OrderBy(t => t.StartDate)
                .ToListAsync();

            var result = tasks.Select(t => new
            {
                t.Id,
                t.Title,
                t.Status,
                StartDate = t.StartDate.ToString("yyyy-MM-dd"),
                EndDate = t.EndDate.ToString("yyyy-MM-dd"),
                t.Progress,
                t.AssignedMemberId,
                AssignedMemberName = t.AssignedMember?.Name ?? "Atanmamış",
                AssignedMemberRole = t.AssignedMember?.Role ?? "",
                t.PredecessorId,
                PredecessorTitle = t.Predecessor?.Title ?? "Yok",
                t.Cost
            });

            return Ok(result);
        }

        // 3. Yeni Görev Ekleme (POST)
        [HttpPost]
        public async Task<ActionResult<ProjectTask>> CreateProjectTask(ProjectTask task)
        {
            // UTC saat uyumluluğu için tarihleri UTC'ye çekiyoruz
            task.StartDate = DateTime.SpecifyKind(task.StartDate, DateTimeKind.Utc);
            task.EndDate = DateTime.SpecifyKind(task.EndDate, DateTimeKind.Utc);

            _context.ProjectTasks.Add(task);
            await _context.SaveChangesAsync();

            return Ok(task);
        }

        // 4. Görev Güncelleme (PUT)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProjectTask(int id, ProjectTask task)
        {
            if (id != task.Id)
                return BadRequest();

            task.StartDate = DateTime.SpecifyKind(task.StartDate, DateTimeKind.Utc);
            task.EndDate = DateTime.SpecifyKind(task.EndDate, DateTimeKind.Utc);

            _context.Entry(task).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.ProjectTasks.AnyAsync(e => e.Id == id))
                    return NotFound();
                else
                    throw;
            }

            return NoContent();
        }

        // 5. Görev Silme (DELETE)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProjectTask(int id)
        {
            var task = await _context.ProjectTasks.FindAsync(id);
            if (task == null)
                return NotFound();

            // Bağımlı olan görevlerin PredecessorId değerlerini null yapalım ki hata vermesin
            var dependentTasks = await _context.ProjectTasks.Where(t => t.PredecessorId == id).ToListAsync();
            foreach (var dep in dependentTasks)
            {
                dep.PredecessorId = null;
            }

            _context.ProjectTasks.Remove(task);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // 6. Kritik Yol Görevlerini Getirir (Bolluk süresi 0 olan görevler)
        [HttpGet("critical")]
        public async Task<IActionResult> GetCriticalTasks()
        {
            var tasks = await _context.ProjectTasks.ToListAsync();

            if (!tasks.Any())
                return Ok(new List<object>());

            var projectEnd = tasks.Max(t => t.EndDate);

            var criticalTasks = tasks.Select(t => {
                var successors = tasks.Where(s => s.PredecessorId == t.Id).ToList();
                DateTime lateFinish = successors.Any() ? successors.Min(s => s.StartDate) : projectEnd;
                double slackDays = (lateFinish - t.EndDate).TotalDays;
                return new { Task = t, SlackDays = slackDays };
            })
            .Where(x => x.SlackDays <= 0.5) // 0.5 günden az bolluk kritik kabul edilir
            .Select(x => new
            {
                x.Task.Id,
                x.Task.Title,
                StartDate = x.Task.StartDate.ToString("yyyy-MM-dd"),
                EndDate = x.Task.EndDate.ToString("yyyy-MM-dd"),
                Duration = (x.Task.EndDate - x.Task.StartDate).TotalDays,
                x.Task.Progress,
                x.Task.Cost
            })
            .OrderBy(t => t.StartDate);

            return Ok(criticalTasks);
        }

        // 7. Bolluk Sürelerini Hesaplar
        [HttpGet("slack")]
        public async Task<IActionResult> GetSlack()
        {
            var tasks = await _context.ProjectTasks.ToListAsync();

            if (!tasks.Any())
                return Ok(new List<object>());

            var projectEnd = tasks.Max(t => t.EndDate);

            var result = tasks.Select(t =>
            {
                var successors = tasks.Where(s => s.PredecessorId == t.Id).ToList();
                DateTime lateFinish = successors.Any() ? successors.Min(s => s.StartDate) : projectEnd;
                double slackDays = (lateFinish - t.EndDate).TotalDays;
                if (slackDays < 0) slackDays = 0;

                return new
                {
                    t.Id,
                    t.Title,
                    SlackDays = Math.Round(slackDays, 1),
                    IsCritical = slackDays <= 0.5
                };
            }).OrderByDescending(x => x.SlackDays);

            return Ok(result);
        }

        // 8. Gantt Görünümü için Veri Sağlar
        [HttpGet("gantt")]
        public async Task<IActionResult> GetGantt()
        {
            var tasks = await _context.ProjectTasks
                .Include(t => t.AssignedMember)
                .OrderBy(t => t.StartDate)
                .ToListAsync();

            var result = tasks.Select(t => new
            {
                t.Id,
                t.Title,
                Start = t.StartDate.ToString("yyyy-MM-dd"),
                End = t.EndDate.ToString("yyyy-MM-dd"),
                t.Progress,
                AssignedMemberName = t.AssignedMember?.Name ?? "Atanmamış",
                AssignedMemberRole = t.AssignedMember?.Role ?? "",
                t.Status
            });

            return Ok(result);
        }
    }
}