
namespace Fivvy.Api.Models;

public class AdminDashboardModel
{
    public DateTime GeneratedAt { get; set; }
    public int TotalUsers { get; set; }
    public int NewUsersLast30Days { get; set; }
    public IReadOnlyCollection<RoleDistributionModel> RoleDistribution { get; set; } = Array.Empty<RoleDistributionModel>();
    public IReadOnlyCollection<UserSummaryModel> TopUsersByClient { get; set; } = Array.Empty<UserSummaryModel>();
    public IReadOnlyCollection<AdminUserListItemModel> Users { get; set; } = Array.Empty<AdminUserListItemModel>();
    public EntityTotalsModel EntityTotals { get; set; } = new();
}