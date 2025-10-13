
namespace Fivvy.Api.Models;

public class DashboardActivitiesRequest
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    private int _page = 1;
    private int _pageSize = DefaultPageSize;

    public int Page
    {
        get => _page;
        set => _page = value < 1 ? 1 : value;
    }

    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value switch
        {
            < 1 => DefaultPageSize,
            > MaxPageSize => MaxPageSize,
            _ => value
        };
    }

    public string? Type { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}