using FilmTakipAPI.Data;
using Microsoft.EntityFrameworkCore;
using FilmTakipAPI.Entities.ProjectManagement;
using FilmTakipAPI.Models;
namespace FilmTakipAPI
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll",
                    policy =>
                    {
                        policy.AllowAnyOrigin()
                              .AllowAnyHeader()
                              .AllowAnyMethod();
                    });
            });

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.UseCors("AllowAll");
            app.UseAuthorization();

            // Seed Veritabanı
            using (var scope = app.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                try
                {
                    context.Database.Migrate();

                    // Seed Movies
                    if (!context.Movies.Any())
                    {
                        context.Movies.AddRange(new List<Movie>
                        {
                            new Movie { Title = "Inception", Description = "Zihnin en savunmasız olduğu rüya görme anında, bilinçaltının derinliklerindeki sırları çalma sanatı ve rüya içinde rüya.", ReleaseYear = 2010, Genre = "Bilim Kurgu", ImageUrl = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500" },
                            new Movie { Title = "The Dark Knight", Description = "Gotham City'de düzeni bozmak isteyen anarşist Joker'e karşı Batman'in psikolojik ve fiziksel mücadelesi.", ReleaseYear = 2008, Genre = "Aksiyon / Suç", ImageUrl = "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=500" },
                            new Movie { Title = "Interstellar", Description = "Gelecekte geçen filmde, insanlığın yok olma tehlikesiyle karşı karşıya kalması üzerine yeni bir yaşanabilir gezegen arayışı.", ReleaseYear = 2014, Genre = "Bilim Kurgu / Macera", ImageUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500" },
                            new Movie { Title = "Pulp Fiction", Description = "Birbirinden bağımsız görünen ama kaderin cilvesiyle yolları kesişen suçlular, tetikçiler ve boksörün hikayesi.", ReleaseYear = 1994, Genre = "Suç / Dram", ImageUrl = "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500" }
                        });
                        context.SaveChanges();
                    }

                    // Seed TeamMembers
                    if (!context.TeamMembers.Any())
                    {
                        context.TeamMembers.AddRange(new List<TeamMember>
                        {
                            new TeamMember { Name = "Ahmet Yılmaz", Role = "Project Manager" },
                            new TeamMember { Name = "Ayşe Kaya", Role = "Full Stack Developer" },
                            new TeamMember { Name = "Mehmet Demir", Role = "QA Engineer" },
                            new TeamMember { Name = "Elif Çelik", Role = "UX/UI Designer" }
                        });
                        context.SaveChanges();
                    }

                    // Seed Budgets
                    if (!context.Budgets.Any())
                    {
                        context.Budgets.Add(new Budget
                        {
                            PlannedBudget = 35000,
                            SpentBudget = 15000
                        });
                        context.SaveChanges();
                    }

                    // Seed ProjectTasks
                    if (!context.ProjectTasks.Any())
                    {
                        var pm = context.TeamMembers.FirstOrDefault(m => m.Role == "Project Manager");
                        var dev = context.TeamMembers.FirstOrDefault(m => m.Role == "Full Stack Developer");
                        var qa = context.TeamMembers.FirstOrDefault(m => m.Role == "QA Engineer");
                        var designer = context.TeamMembers.FirstOrDefault(m => m.Role == "UX/UI Designer");

                        var task1 = new ProjectTask
                        {
                            Title = "Gereksinim Analizi ve Proje Planlama",
                            Status = "Done",
                            StartDate = DateTime.UtcNow.Date.AddDays(-15),
                            EndDate = DateTime.UtcNow.Date.AddDays(-10),
                            Progress = 100,
                            Cost = 2000,
                            AssignedMemberId = pm?.Id
                        };
                        context.ProjectTasks.Add(task1);
                        context.SaveChanges();

                        var task2 = new ProjectTask
                        {
                            Title = "Veritabanı Tasarımı ve API Altyapısının Kurulması",
                            Status = "Done",
                            StartDate = DateTime.UtcNow.Date.AddDays(-10),
                            EndDate = DateTime.UtcNow.Date.AddDays(-5),
                            Progress = 100,
                            Cost = 4000,
                            AssignedMemberId = dev?.Id,
                            PredecessorId = task1.Id
                        };
                        var task3 = new ProjectTask
                        {
                            Title = "Kullanıcı Arayüzü (UI/UX) Tasarımları",
                            Status = "Done",
                            StartDate = DateTime.UtcNow.Date.AddDays(-9),
                            EndDate = DateTime.UtcNow.Date.AddDays(-4),
                            Progress = 100,
                            Cost = 3000,
                            AssignedMemberId = designer?.Id,
                            PredecessorId = task1.Id
                        };
                        context.ProjectTasks.AddRange(task2, task3);
                        context.SaveChanges();

                        var task4 = new ProjectTask
                        {
                            Title = "Film Yönetimi API Geliştirmesi",
                            Status = "In Progress",
                            StartDate = DateTime.UtcNow.Date.AddDays(-4),
                            EndDate = DateTime.UtcNow.Date.AddDays(2),
                            Progress = 75,
                            Cost = 5000,
                            AssignedMemberId = dev?.Id,
                            PredecessorId = task2.Id
                        };
                        var task5 = new ProjectTask
                        {
                            Title = "Proje Yönetimi Arayüzü ve Gantt Şeması",
                            Status = "In Progress",
                            StartDate = DateTime.UtcNow.Date.AddDays(-3),
                            EndDate = DateTime.UtcNow.Date.AddDays(3),
                            Progress = 60,
                            Cost = 6000,
                            AssignedMemberId = dev?.Id,
                            PredecessorId = task3.Id
                        };
                        context.ProjectTasks.AddRange(task4, task5);
                        context.SaveChanges();

                        var task6 = new ProjectTask
                        {
                            Title = "Raporlama ve PDF Çıktı Modülü",
                            Status = "To Do",
                            StartDate = DateTime.UtcNow.Date.AddDays(3),
                            EndDate = DateTime.UtcNow.Date.AddDays(7),
                            Progress = 0,
                            Cost = 2500,
                            AssignedMemberId = dev?.Id,
                            PredecessorId = task5.Id
                        };
                        var task7 = new ProjectTask
                        {
                            Title = "Sistem Testleri ve Hata Giderme",
                            Status = "To Do",
                            StartDate = DateTime.UtcNow.Date.AddDays(6),
                            EndDate = DateTime.UtcNow.Date.AddDays(10),
                            Progress = 0,
                            Cost = 2000,
                            AssignedMemberId = qa?.Id,
                            PredecessorId = task4.Id
                        };
                        context.ProjectTasks.AddRange(task6, task7);
                        context.SaveChanges();
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Seed Hatasi: " + ex.Message);
                }
            }

            app.MapControllers();

            app.Run();
        }
    }
}
