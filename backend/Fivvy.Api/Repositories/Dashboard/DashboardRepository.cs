using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Fivvy.Api.Data;
using Fivvy.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Fivvy.Api.Repositories;

public class DashboardRepository : IDashboardRepository
{
    private readonly AppDbContext _context;
    private readonly IUserRepository _userRepository;

    public DashboardRepository(AppDbContext context, IUserRepository userRepository)
    {
        _context = context;
        _userRepository = userRepository;
    }

    public async Task<DashboardModel> OverviewAsync(string token)
    {
        var userId = _userRepository.ExtractUserIdFromToken(token);

        var clients = await ClientsForUser(userId)
            .Select(c => new { c.Id, c.CompanyName, c.ContactName, c.Email, c.CreatedAt })
            .ToListAsync();

        var invoices = await InvoicesForUser(userId).ToListAsync();
        var projects = await ProjectsForUser(userId).ToListAsync();

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var previousStart = startOfMonth.AddMonths(-1);
        var previousEnd = startOfMonth.AddTicks(-1);
        var sixMonthsAgo = startOfMonth.AddMonths(-5);

        var currentRevenue = invoices
            .Where(i => i.InvoiceDate >= startOfMonth && i.InvoiceDate <= now)
            .Sum(i => i.Total);

        var previousRevenue = invoices
            .Where(i => i.InvoiceDate >= previousStart && i.InvoiceDate <= previousEnd)
            .Sum(i => i.Total);

        var outstandingRevenue = invoices
            .Where(i => i.InvoiceDate > now)
            .Sum(i => i.Total);

        var activeProjects = projects.Count(p => !p.EndDate.HasValue || p.EndDate.Value >= now);

        var completedProjects = projects.Where(p => p.EndDate.HasValue).ToList();
        var avgDeliveryDays = completedProjects.Any()
            ? completedProjects.Average(p => (p.EndDate!.Value - p.StartDate).TotalDays)
            : 0d;

        var revenueTrendAll = invoices
            .Where(i => i.InvoiceDate >= sixMonthsAgo)
            .GroupBy(i => new { i.InvoiceDate.Year, i.InvoiceDate.Month })
            .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month)
            .Select(g => new DashboardRevenuePointModel
            {
                Label = CultureInfo.CurrentCulture.DateTimeFormat.GetAbbreviatedMonthName(g.Key.Month),
                Value = new DashboardValueModel
                {
                    Amount = g.Sum(x => x.Total),
                    Currency = "TRY"
                }
            })
            .ToList();

        var revenueTrend = revenueTrendAll.Count > 6
            ? revenueTrendAll.Skip(revenueTrendAll.Count - 6).ToList()
            : revenueTrendAll;

        var clientLookup = clients.ToDictionary(c => c.Id, c => c.CompanyName);

        var pipelineInsights = projects
            .GroupBy(p => p.ClientId)
            .OrderByDescending(g => g.Count())
            .Take(3)
            .Select(g =>
            {
                var label = clientLookup.TryGetValue(g.Key, out var name) ? name : $"Müşteri #{g.Key}";
                var completed = g.Count(p => p.EndDate.HasValue);
                return new DashboardPipelineInsightModel
                {
                    Key = NormalizeKey(label),
                    Title = label,
                    Value = g.Count(),
                    Meta = completed > 0 ? $"{completed} tamamlandı" : null
                };
            })
            .ToList();

        if (!pipelineInsights.Any())
        {
            pipelineInsights.Add(new DashboardPipelineInsightModel
            {
                Key = "empty",
                Title = "Pipeline boş",
                Value = 0,
                Meta = "Yeni projeler oluşturun"
            });
        }

        var activityFeed = (await BuildActivityFeedAsync(userId))
            .OrderByDescending(a => a.Timestamp)
            .Take(10)
            .ToList();

        return new DashboardModel
        {
            Range = new DashboardRangeModel
            {
                Current = new DashboardDateRangeModel { Start = startOfMonth, End = now },
                Comparison = new DashboardDateRangeModel { Start = previousStart, End = previousEnd }
            },
            Summary =
            {
                new DashboardSummaryCardModel
                {
                    Key = "mrr",
                    Label = "Ay bazlı gelir",
                    Value = new DashboardValueModel { Amount = currentRevenue, Currency = "TRY" },
                    Change = BuildChange(currentRevenue, previousRevenue)
                },
                new DashboardSummaryCardModel
                {
                    Key = "activeProjects",
                    Label = "Aktif projeler",
                    Value = new DashboardValueModel { Amount = activeProjects }
                },
                new DashboardSummaryCardModel
                {
                    Key = "outstanding",
                    Label = "Yaklaşan faturalar",
                    Value = new DashboardValueModel { Amount = outstandingRevenue, Currency = "TRY" }
                },
                new DashboardSummaryCardModel
                {
                    Key = "avgDeliveryTime",
                    Label = "Ortalama teslim süresi",
                    Value = new DashboardValueModel { Amount = (decimal)Math.Round(avgDeliveryDays, 1), Currency = "days" }
                }
            },
            RevenueTrend = revenueTrend,
            PipelineInsights = pipelineInsights,
            ActivityFeed = activityFeed
        };
    }

    public async Task<ActivityModel> GetActivitiesAsync(string token, int page = 1, int pageSize = 20)
    {
        var userId = _userRepository.ExtractUserIdFromToken(token);
        page = Math.Max(page, 1);
        pageSize = Math.Max(pageSize, 1);

        var activities = (await BuildActivityFeedAsync(userId))
            .OrderByDescending(a => a.Timestamp)
            .ToList();

        var total = activities.Count;
        var items = activities.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        return new ActivityModel
        {
            Page = page,
            PageSize = pageSize,
            Total = total,
            Items = items
        };
    }

    private async Task<IList<ActivityItemModel>> BuildActivityFeedAsync(int userId)
    {
        var clientRecords = await ClientsForUser(userId)
            .Select(c => new { c.Id, c.CompanyName, c.ContactName, c.Email, c.CreatedAt })
            .ToListAsync();

        var clientEvents = clientRecords
            .Select(c => new ActivityItemModel
            {
                Id = $"client-{c.Id}",
                Type = "client",
                Title = c.CompanyName,
                Description = string.IsNullOrWhiteSpace(c.ContactName) ? c.Email : c.ContactName,
                Actor = new ActivityActorModel
                {
                    Name = c.CompanyName,
                    Initials = BuildInitials(c.CompanyName)
                },
                Timestamp = c.CreatedAt
            })
            .ToList();

        var projectRecords = await ProjectsForUser(userId)
            .Select(p => new { p.Id, p.ProjectName, p.Description, p.StartDate, p.EndDate, p.ClientId })
            .ToListAsync();

        var projectEvents = projectRecords
            .Select(p => new ActivityItemModel
            {
                Id = $"project-{p.Id}",
                Type = "project",
                Title = string.IsNullOrWhiteSpace(p.ProjectName) ? $"Proje #{p.Id}" : p.ProjectName,
                Description = string.IsNullOrWhiteSpace(p.Description) ? "Projeye başlanıldı" : p.Description,
                Actor = new ActivityActorModel
                {
                    Name = p.ProjectName,
                    Initials = BuildInitials(p.ProjectName)
                },
                Timestamp = p.EndDate ?? p.StartDate
            })
            .ToList();

        var invoiceRecords = await InvoicesForUser(userId)
            .Select(i => new { i.Id, i.InvoiceNumber, i.InvoiceDate, Amount = i.Total, i.ClientId })
            .ToListAsync();

        var invoiceEvents = invoiceRecords
            .Select(i =>
            {
                var clientName = clientRecords.FirstOrDefault(c => c.Id == i.ClientId)?.CompanyName ?? $"Müşteri #{i.ClientId}";
                return new ActivityItemModel
                {
                    Id = $"invoice-{i.Id}",
                    Type = "invoice",
                    Title = $"Fatura #{i.InvoiceNumber}",
                    Description = $"{clientName} · {i.Amount:N0} TRY",
                    Actor = new ActivityActorModel
                    {
                        Name = clientName,
                        Initials = BuildInitials(clientName)
                    },
                    Timestamp = i.InvoiceDate
                };
            })
            .ToList();

        return clientEvents.Concat(projectEvents).Concat(invoiceEvents).ToList();
    }

    private IQueryable<ClientModel> ClientsForUser(int userId) =>
        _context.Clients
            .AsNoTracking()
            .Where(c => c.UserId == userId);

    private IQueryable<ProjectModel> ProjectsForUser(int userId)
    {
        var clientIds = ClientsForUser(userId).Select(c => c.Id);

        return _context.Projects
            .AsNoTracking()
            .Where(p => clientIds.Contains(p.ClientId));
    }

    private IQueryable<InvoiceModel> InvoicesForUser(int userId)
    {
        var clientIds = ClientsForUser(userId).Select(c => c.Id);

        return _context.Invoices
            .AsNoTracking()
            .Where(i => clientIds.Contains(i.ClientId));
    }

    private static DashboardChangeIndicatorModel BuildChange(decimal current, decimal previous)
    {
        var diff = current - previous;
        var percent = previous == 0 ? (current > 0 ? 100 : 0) : (diff / previous) * 100m;

        return new DashboardChangeIndicatorModel
        {
            Absolute = diff,
            Percent = percent,
            Trend = diff switch
            {
                > 0 => "up",
                < 0 => "down",
                _ => "steady"
            }
        };
    }

    private static string NormalizeKey(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? "unknown"
            : value.Trim().ToLowerInvariant().Replace(' ', '-');

    private static string? BuildInitials(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var parts = value.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length >= 2
            ? $"{char.ToUpperInvariant(parts[0][0])}{char.ToUpperInvariant(parts[1][0])}"
            : char.ToUpperInvariant(parts[0][0]).ToString();
    }
}