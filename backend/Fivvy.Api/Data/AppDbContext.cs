using Microsoft.EntityFrameworkCore;
using Fivvy.Api.Models;

namespace Fivvy.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions options) : base(options)
    {

    }

    public DbSet<UserModel> Users { get; set; }
    public DbSet<ClientModel> Clients { get; set; }
    public DbSet<InvoiceModel> Invoices { get; set; }
    public DbSet<ProjectModel> Projects { get; set; }
    public DbSet<UserRefreshToken> RefreshTokens { get; set; } = default!;
}