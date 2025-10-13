
using Fivvy.Api.Models;
using Fivvy.Api.Data;
using Fivvy.Api.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Fivvy.Api.Repositories;


public class AuthRepository : IAuthRepository
{
    private readonly AppDbContext _context;
    private readonly IUserRepository _userRepository;

    public AuthRepository(AppDbContext context, IUserRepository userRepository)
    {
        _context = context;
        _userRepository = userRepository;
    }

    private async Task<bool> IsAdmin(string token)
    {
        var userId = _userRepository.ExtractUserIdFromToken(token);
        var user = await _userRepository.GetUserById(userId);

        if (user == null)
        {
            throw new UserNotFoundException();
        }

        return string.Equals(user.Role, "admin", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<AdminDashboardModel> AdminStatsAsync(string token)
    {
        if (!await IsAdmin(token))
        {
            throw new UnauthorizedAccessException("Only admins may access this resource.");
        }

        var now = DateTime.UtcNow;
        var last30Days = now.AddDays(-30);

        var usersSnapshot = await _context.Users
            .AsNoTracking()
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.CreatedAt,
                Role = string.IsNullOrWhiteSpace(u.Role) ? "user" : u.Role,
                FullName = string.Concat(u.Name, " ", u.Surname).Trim(),
                ClientCount = u.Clients.Count
            })
            .ToListAsync();

        var totalUsers = usersSnapshot.Count;
        var newUsers = usersSnapshot.Count(u => u.CreatedAt >= last30Days);

        var roleDistribution = usersSnapshot
            .GroupBy(u => string.IsNullOrWhiteSpace(u.Role) ? "unknown" : u.Role)
            .Select(g => new RoleDistributionModel
            {
                Role = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(g => g.Count)
            .ToList();

        var topUsersByClients = usersSnapshot
            .OrderByDescending(u => u.ClientCount)
            .ThenBy(u => u.Id)
            .Take(5)
            .Select(u => new UserSummaryModel
            {
                UserId = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                ClientCount = u.ClientCount
            })
            .ToList();

        var users = usersSnapshot
            .OrderBy(u => u.Id)
            .Select(u => new AdminUserListItemModel
            {
                UserId = u.Id,
                FullName = u.FullName,
                Username = u.Username,
                Email = u.Email,
                Role = string.IsNullOrWhiteSpace(u.Role) ? "user" : u.Role,
                ClientCount = u.ClientCount,
                CreatedAt = u.CreatedAt
            })
            .ToList();

        var entityTotals = new EntityTotalsModel
        {
            Clients = await _context.Clients.AsNoTracking().CountAsync(),
            Projects = await _context.Projects.AsNoTracking().CountAsync(),
            Invoices = await _context.Invoices.AsNoTracking().CountAsync(),
        };

        return new AdminDashboardModel
        {
            GeneratedAt = now,
            TotalUsers = totalUsers,
            NewUsersLast30Days = newUsers,
            RoleDistribution = roleDistribution,
            TopUsersByClient = topUsersByClients,
            Users = users,
            EntityTotals = entityTotals,
        };
    }
}