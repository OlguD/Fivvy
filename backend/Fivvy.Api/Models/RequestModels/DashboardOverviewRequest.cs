
namespace Fivvy.Api.Models;


public class DashboardOverviewRequest
{
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public DateTime? CompareFrom { get; set; }
    public DateTime? CompareTo { get; set; }
    public string? Currency { get; set; }
}