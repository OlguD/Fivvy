using Microsoft.EntityFrameworkCore;
using Fivvy.Api.Models;

namespace Fivvy.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions options) : base(options)
    {

    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<InvoiceModel>()
                .Property(i => i.Amount)
                .HasPrecision(18, 2); // 18 digit toplam 2 decimal places

        modelBuilder.Entity<UserModel>()
                .Property(u => u.TotalIncome)
                .HasPrecision(18, 2);
    }

    public DbSet<UserModel> Users { get; set; }
    public DbSet<ClientModel> Clients { get; set; }
    public DbSet<InvoiceModel> Invoices { get; set; }
    public DbSet<ProjectModel> Projects { get; set; }
    public DbSet<UserRefreshToken> RefreshTokens { get; set; } = default!;
}