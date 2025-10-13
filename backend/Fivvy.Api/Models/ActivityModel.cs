

namespace Fivvy.Api.Models;


public class ActivityModel
{
    public IList<ActivityItemModel> Items { get; set; } = new List<ActivityItemModel>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int Total { get; set; }
}

public class ActivityItemModel
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ActivityActorModel Actor { get; set; } = new();
    public DateTime Timestamp { get; set; }
}

public class ActivityActorModel
{
    public string? Initials { get; set; }
    public string? Name { get; set; }
    public string? AvatarUrl { get; set; }
}