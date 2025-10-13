

namespace Fivvy.Api.Models;

public class DashboardModel
{
    public DashboardRangeModel Range { get; set; } = new();
    public IList<DashboardSummaryCardModel> Summary { get; set; } = new List<DashboardSummaryCardModel>();
    public IList<DashboardRevenuePointModel> RevenueTrend { get; set; } = new List<DashboardRevenuePointModel>();
    public IList<DashboardPipelineInsightModel> PipelineInsights { get; set; } = new List<DashboardPipelineInsightModel>();
    public IList<ActivityItemModel> ActivityFeed { get; set; } = new List<ActivityItemModel>();
}

public class DashboardRangeModel
{
    public DashboardDateRangeModel Current { get; set; } = new();
    public DashboardDateRangeModel Comparison { get; set; } = new();
}

public class DashboardDateRangeModel
{
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
}

public class DashboardSummaryCardModel
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public DashboardValueModel Value { get; set; } = new();
    public DashboardChangeIndicatorModel Change { get; set; } = new();
}

public class DashboardValueModel
{
    public decimal Amount { get; set; }
    public string? Currency { get; set; }
}

public class DashboardChangeIndicatorModel
{
    public decimal Absolute { get; set; }
    public decimal Percent { get; set; }
    public string Trend { get; set; } = "steady";
}

public class DashboardRevenuePointModel
{
    public string Label { get; set; } = string.Empty;
    public DashboardValueModel Value { get; set; } = new();
}

public class DashboardPipelineInsightModel
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public string? Meta { get; set; }
}
